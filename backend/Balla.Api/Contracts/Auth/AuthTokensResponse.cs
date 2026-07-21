namespace Balla.Api.Contracts.Auth;

public record AuthTokensResponse(string AccessToken, string IdToken, string? RefreshToken, int ExpiresIn);
