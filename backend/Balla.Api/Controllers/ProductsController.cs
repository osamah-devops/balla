using System.Text.Json;
using Balla.Api.Contracts.Comments;
using Balla.Api.Contracts.Notifications;
using Balla.Api.Contracts.Products;
using Balla.Api.Contracts.Ratings;
using Balla.Api.Models;
using Balla.Api.Services.Comments;
using Balla.Api.Services.Moderation;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Owners;
using Balla.Api.Services.Products;
using Balla.Api.Services.Ratings;
using Balla.Api.Services.Storage;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Route("api/products")]
public class ProductsController(
    IUserProfileRepository userProfileRepository,
    IProductRepository productRepository,
    IOwnerRepository ownerRepository,
    ICommentRepository commentRepository,
    IRatingRepository ratingRepository,
    IFileStorage fileStorage,
    IContentModerationService contentModerationService,
    INotificationDispatcher notificationDispatcher)
    : BallaControllerBase(userProfileRepository)
{
    private const long MaxImageBytes = 5 * 1024 * 1024;
    public const int MaxExtraImages = 6;

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/webp", "image/gif",
    };

    private static readonly JsonSerializerOptions OptionsJsonSettings = new() { PropertyNameCaseInsensitive = true };

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> List(CancellationToken ct)
    {
        var products = await productRepository.ListAsync(ct);
        return Ok(products.Where(p => !p.Hidden).Select(p => p.ToResponse()));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductResponse>> Get(string id, CancellationToken ct)
    {
        var product = await productRepository.GetAsync(id, ct);
        return product is null ? NotFound() : Ok(product.ToResponse());
    }

    [HttpPost]
    [Authorize]
    [RequestSizeLimit((MaxExtraImages + 1) * MaxImageBytes)]
    public async Task<ActionResult<ProductResponse>> Create([FromForm] CreateProductForm form, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }
        if (profile.Role != "seller" || string.IsNullOrEmpty(profile.OwnerId))
        {
            return StatusCode(403, new { error = "NOT_A_SELLER", message = "Only sellers can list products." });
        }

        var owner = await ownerRepository.GetAsync(profile.OwnerId, ct);
        if (owner is null)
        {
            return StatusCode(403, new { error = "NOT_A_SELLER", message = "No storefront found for this account." });
        }

        if (form.Image is not { Length: > 0 } file)
        {
            return BadRequest(new { error = "IMAGE_REQUIRED", message = "A product photo is required." });
        }
        if (file.Length > MaxImageBytes)
        {
            return BadRequest(new { error = "FILE_TOO_LARGE", message = "Product photo must be smaller than 5MB." });
        }
        if (!AllowedImageContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { error = "INVALID_FILE_TYPE", message = "Product photo must be a PNG, JPEG, WEBP, or GIF image." });
        }

        if (form.ExtraImages is { Count: > 0 } extraFiles)
        {
            if (extraFiles.Count > MaxExtraImages)
            {
                return BadRequest(new { error = "TOO_MANY_IMAGES", message = $"Add at most {MaxExtraImages} extra photos." });
            }
            foreach (var extraFile in extraFiles)
            {
                if (extraFile.Length == 0 || extraFile.Length > MaxImageBytes)
                {
                    return BadRequest(new { error = "FILE_TOO_LARGE", message = "Each extra photo must be smaller than 5MB." });
                }
                if (!AllowedImageContentTypes.Contains(extraFile.ContentType))
                {
                    return BadRequest(new { error = "INVALID_FILE_TYPE", message = "Extra photos must be PNG, JPEG, WEBP, or GIF images." });
                }
            }
        }

        var (options, optionsError) = ParseOptions(form.OptionsJson);
        if (optionsError is not null)
        {
            return BadRequest(new { error = "INVALID_OPTIONS", message = optionsError });
        }

        // Read and moderate every photo up front, before uploading any of them, so a
        // flagged extra photo can't leave the product half-created with a partial gallery.
        var mainImageBytes = await ReadAllBytesAsync(file, ct);
        var mainModeration = await contentModerationService.CheckImageAsync(mainImageBytes, ct);
        if (mainModeration.IsFlagged)
        {
            return BadRequest(new
            {
                error = "CONTENT_REJECTED",
                message = $"This photo was flagged by content moderation ({string.Join(", ", mainModeration.Reasons)}) and can't be used.",
            });
        }

        var extraImageBytes = new List<byte[]>();
        if (form.ExtraImages is { Count: > 0 } filesToCheck)
        {
            foreach (var extraFile in filesToCheck)
            {
                var bytes = await ReadAllBytesAsync(extraFile, ct);
                var moderation = await contentModerationService.CheckImageAsync(bytes, ct);
                if (moderation.IsFlagged)
                {
                    return BadRequest(new
                    {
                        error = "CONTENT_REJECTED",
                        message = $"One of your extra photos was flagged by content moderation ({string.Join(", ", moderation.Reasons)}) and can't be used.",
                    });
                }
                extraImageBytes.Add(bytes);
            }
        }

        var productId = $"PROD-{Guid.NewGuid():N}";
        var extension = Path.GetExtension(file.FileName) is { Length: > 0 } ext ? ext : UsersController.ExtensionFromContentType(file.ContentType);
        await using var stream = new MemoryStream(mainImageBytes);
        var image = await fileStorage.UploadAsync($"product-images/{productId}", stream, file.ContentType, extension, ct);

        List<string>? extraImages = null;
        if (form.ExtraImages is { Count: > 0 } filesToUpload)
        {
            extraImages = [];
            for (var i = 0; i < filesToUpload.Count; i++)
            {
                var extraFile = filesToUpload[i];
                var extraExtension = Path.GetExtension(extraFile.FileName) is { Length: > 0 } extExt ? extExt : UsersController.ExtensionFromContentType(extraFile.ContentType);
                await using var extraStream = new MemoryStream(extraImageBytes[i]);
                extraImages.Add(await fileStorage.UploadAsync($"product-images/{productId}", extraStream, extraFile.ContentType, extraExtension, ct));
            }
        }

        var product = new Product
        {
            Id = productId,
            Category = form.Category,
            CategorySlug = form.CategorySlug,
            Title = form.Title,
            Price = form.Price,
            Currency = form.Currency,
            WeightLbs = form.WeightLbs,
            FullDescription = form.FullDescription,
            Image = image,
            ExtraImages = extraImages,
            Options = options,
            OwnerId = owner.Id,
            OwnerName = owner.Name,
            OwnerLocation = owner.Location,
            OwnerState = owner.State,
            OwnerZip = owner.Zip,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        };
        await productRepository.PutAsync(product, ct);
        return Ok(product.ToResponse());
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ProductResponse>> Update(string id, UpdateProductForm form, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var product = await productRepository.GetAsync(id, ct);
        if (product is null)
        {
            return NotFound();
        }
        if (string.IsNullOrEmpty(profile.OwnerId) || product.OwnerId != profile.OwnerId)
        {
            return StatusCode(403, new { error = "NOT_OWNER", message = "Only the seller who listed this product can edit it." });
        }

        var (options, optionsError) = ParseOptions(form.OptionsJson);
        if (optionsError is not null)
        {
            return BadRequest(new { error = "INVALID_OPTIONS", message = optionsError });
        }

        product.Title = form.Title;
        product.Category = form.Category;
        product.CategorySlug = form.CategorySlug;
        product.Price = form.Price;
        product.Currency = form.Currency;
        product.WeightLbs = form.WeightLbs;
        product.FullDescription = form.FullDescription;
        product.Options = options;

        await productRepository.PutAsync(product, ct);
        return Ok(product.ToResponse());
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(string id, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var product = await productRepository.GetAsync(id, ct);
        if (product is null)
        {
            return NotFound();
        }
        if (string.IsNullOrEmpty(profile.OwnerId) || product.OwnerId != profile.OwnerId)
        {
            return StatusCode(403, new { error = "NOT_OWNER", message = "Only the seller who listed this product can delete it." });
        }

        await productRepository.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CommentResponse>>> ListComments(string id, CancellationToken ct)
    {
        var comments = await commentRepository.ListByProductAsync(id, ct);
        return Ok(comments.Select(c => c.ToResponse()));
    }

    [HttpPost("{id}/comments")]
    [Authorize]
    public async Task<ActionResult<CommentResponse>> AddComment(string id, CreateCommentRequest request, CancellationToken ct)
    {
        var product = await productRepository.GetAsync(id, ct);
        if (product is null)
        {
            return NotFound();
        }
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var comment = new Comment
        {
            ProductId = id,
            CommentId = $"{DateTime.UtcNow:O}#{Guid.NewGuid():N}",
            AuthorId = profile.UserId,
            AuthorName = profile.Name,
            Body = request.Body,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        };
        await commentRepository.PutAsync(comment, ct);

        await notificationDispatcher.DispatchAsync(
            product.OwnerId,
            NotificationType.Comment,
            $"{profile.Name} commented on \"{product.Title}\"",
            conversationId: null,
            product.Id,
            product.Title,
            ct);

        return Ok(comment.ToResponse());
    }

    [HttpPost("{id}/ratings")]
    [Authorize]
    public async Task<ActionResult<ProductResponse>> Rate(string id, RateProductRequest request, CancellationToken ct)
    {
        var product = await productRepository.GetAsync(id, ct);
        if (product is null)
        {
            return NotFound();
        }
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var rating = new Rating
        {
            ProductId = id,
            UserId = profile.UserId,
            Stars = request.Stars,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        };
        await ratingRepository.PutAsync(rating, ct);

        var allRatings = await ratingRepository.ListByProductAsync(id, ct);
        product.RatingCount = allRatings.Count;
        product.AverageRating = allRatings.Count == 0 ? 0 : Math.Round(allRatings.Average(r => r.Stars), 2);
        await productRepository.PutAsync(product, ct);

        await notificationDispatcher.DispatchAsync(
            product.OwnerId,
            NotificationType.Rating,
            $"{profile.Name} rated \"{product.Title}\" {request.Stars} stars",
            conversationId: null,
            product.Id,
            product.Title,
            ct);

        return Ok(product.ToResponse());
    }

    private static async Task<byte[]> ReadAllBytesAsync(IFormFile file, CancellationToken ct)
    {
        using var memoryStream = new MemoryStream();
        await using var stream = file.OpenReadStream();
        await stream.CopyToAsync(memoryStream, ct);
        return memoryStream.ToArray();
    }

    private static (List<ProductOption>? Options, string? Error) ParseOptions(string? optionsJson)
    {
        if (string.IsNullOrWhiteSpace(optionsJson))
        {
            return (null, null);
        }

        List<ProductOptionInput>? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<List<ProductOptionInput>>(optionsJson, OptionsJsonSettings);
        }
        catch (JsonException)
        {
            return (null, "Product options were malformed.");
        }

        var options = parsed?
            .Where(o => !string.IsNullOrWhiteSpace(o.Name) && o.Values is { Count: > 0 })
            .Select(o => new ProductOption
            {
                Name = o.Name.Trim(),
                Values = o.Values.Select(v => v.Trim()).Where(v => v.Length > 0).ToList(),
            })
            .Where(o => o.Values.Count > 0)
            .ToList();
        return (options, null);
    }
}
