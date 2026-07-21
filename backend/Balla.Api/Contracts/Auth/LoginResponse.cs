using Balla.Api.Contracts.Users;

namespace Balla.Api.Contracts.Auth;

public record LoginResponse(
    string AccessToken,
    string IdToken,
    string? RefreshToken,
    int ExpiresIn,
    UserProfileResponse User
);
