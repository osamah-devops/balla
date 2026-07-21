using Balla.Api.Contracts.Users;
using Balla.Api.Services.Moderation;
using Balla.Api.Services.Storage;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Route("api/users")]
[Authorize]
public class UsersController(IUserProfileRepository userProfileRepository, IFileStorage fileStorage, IContentModerationService contentModerationService)
    : BallaControllerBase(userProfileRepository)
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/webp", "image/gif",
    };

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponse>> GetMe(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        return profile is null ? NotFound() : Ok(profile.ToResponse());
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileResponse>> UpdateMe(UpdateProfileRequest request, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        profile.Name = request.Name;
        profile.ZipCode = request.ZipCode;
        profile.State = request.State;
        await userProfileRepository.PutAsync(profile, ct);

        return Ok(profile.ToResponse());
    }

    [HttpPost("me/profile-image")]
    [RequestSizeLimit(MaxImageBytes)]
    public async Task<ActionResult<UserProfileResponse>> UploadProfileImage(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { error = "EMPTY_FILE", message = "No file was uploaded." });
        }
        if (file.Length > MaxImageBytes)
        {
            return BadRequest(new { error = "FILE_TOO_LARGE", message = "Profile photo must be smaller than 5MB." });
        }
        if (!AllowedImageContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { error = "INVALID_FILE_TYPE", message = "Profile photo must be a PNG, JPEG, WEBP, or GIF image." });
        }

        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        byte[] imageBytes;
        using (var memoryStream = new MemoryStream())
        {
            await using var readStream = file.OpenReadStream();
            await readStream.CopyToAsync(memoryStream, ct);
            imageBytes = memoryStream.ToArray();
        }

        var moderation = await contentModerationService.CheckImageAsync(imageBytes, ct);
        if (moderation.IsFlagged)
        {
            return BadRequest(new
            {
                error = "CONTENT_REJECTED",
                message = $"This photo was flagged by content moderation ({string.Join(", ", moderation.Reasons)}) and can't be used.",
            });
        }

        var extension = Path.GetExtension(file.FileName) is { Length: > 0 } ext ? ext : ExtensionFromContentType(file.ContentType);
        using var uploadStream = new MemoryStream(imageBytes);
        var url = await fileStorage.UploadAsync($"profile-images/{profile.UserId}", uploadStream, file.ContentType, extension, ct);

        profile.ProfileImageUrl = url;
        await userProfileRepository.PutAsync(profile, ct);

        return Ok(profile.ToResponse());
    }

    [HttpGet("me/blocked")]
    public async Task<ActionResult<IReadOnlyList<string>>> ListBlocked(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        return Ok((IReadOnlyList<string>?)profile?.BlockedUserIds ?? Array.Empty<string>());
    }

    [HttpPost("me/blocked/{userId}")]
    public async Task<IActionResult> BlockUser(string userId, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }
        if (userId == profile.UserId)
        {
            return BadRequest(new { error = "CANNOT_BLOCK_SELF", message = "You can't block yourself." });
        }

        profile.BlockedUserIds ??= [];
        if (!profile.BlockedUserIds.Contains(userId))
        {
            profile.BlockedUserIds.Add(userId);
            await userProfileRepository.PutAsync(profile, ct);
        }
        return NoContent();
    }

    [HttpDelete("me/blocked/{userId}")]
    public async Task<IActionResult> UnblockUser(string userId, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }
        if (profile.BlockedUserIds?.Remove(userId) == true)
        {
            await userProfileRepository.PutAsync(profile, ct);
        }
        return NoContent();
    }

    internal static string ExtensionFromContentType(string contentType) => contentType switch
    {
        "image/png" => ".png",
        "image/jpeg" => ".jpg",
        "image/webp" => ".webp",
        "image/gif" => ".gif",
        _ => "",
    };
}
