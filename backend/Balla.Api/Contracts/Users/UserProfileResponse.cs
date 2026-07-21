namespace Balla.Api.Contracts.Users;

public record UserProfileResponse(
    string Id,
    string Name,
    string Email,
    string Role,
    string Status,
    string JoinedDate,
    string ZipCode,
    string State,
    string? ProfileImageUrl,
    string? OwnerId
);
