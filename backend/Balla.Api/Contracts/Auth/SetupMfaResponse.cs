namespace Balla.Api.Contracts.Auth;

public record SetupMfaResponse(string SecretCode, string OtpAuthUrl);
