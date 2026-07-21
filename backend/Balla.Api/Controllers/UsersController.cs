using Balla.Api.Contracts.Users;
using Balla.Api.Services.Storage;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Route("api/users")]
[Authorize]
public class UsersController(IUserProfileRepository userProfileRepository, IFileStorage fileStorage)
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

        var extension = Path.GetExtension(file.FileName) is { Length: > 0 } ext ? ext : ExtensionFromContentType(file.ContentType);
        await using var stream = file.OpenReadStream();
        var url = await fileStorage.UploadAsync($"profile-images/{profile.UserId}", stream, file.ContentType, extension, ct);

        profile.ProfileImageUrl = url;
        await userProfileRepository.PutAsync(profile, ct);

        return Ok(profile.ToResponse());
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
