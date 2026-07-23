namespace Balla.Api.Services.Auth;

public interface ICognitoAuthService
{
    /// <summary>Returns the new user's Cognito sub.</summary>
    Task<string> SignUpAsync(string email, string password, string name, CancellationToken ct);
    Task ConfirmSignUpAsync(string email, string code, CancellationToken ct);
    Task ResendConfirmationCodeAsync(string email, CancellationToken ct);
    Task<LoginOutcome> LoginAsync(string email, string password, CancellationToken ct);
    Task<AuthTokens> RespondToMfaChallengeAsync(string email, string session, string code, CancellationToken ct);
    Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken ct);
    Task<string> GetUserIdAsync(string accessToken, CancellationToken ct);
    Task ForgotPasswordAsync(string email, CancellationToken ct);
    Task ConfirmForgotPasswordAsync(string email, string code, string newPassword, CancellationToken ct);
    Task ChangePasswordAsync(string accessToken, string currentPassword, string newPassword, CancellationToken ct);
    Task<string> AssociateSoftwareTokenAsync(string accessToken, CancellationToken ct);
    Task VerifySoftwareTokenAsync(string accessToken, string code, CancellationToken ct);
    Task SetSoftwareTokenMfaEnabledAsync(string accessToken, bool enabled, CancellationToken ct);
    Task<bool> IsSoftwareTokenMfaEnabledAsync(string accessToken, CancellationToken ct);
}
