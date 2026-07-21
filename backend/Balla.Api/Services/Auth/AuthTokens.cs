namespace Balla.Api.Services.Auth;

public record AuthTokens(string AccessToken, string IdToken, string? RefreshToken, int ExpiresIn);
