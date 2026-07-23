namespace Balla.Api.Services.Auth;

/// <summary>Either tokens (normal login) or an MFA challenge that must be completed
/// with a follow-up call before tokens are issued.</summary>
public class LoginOutcome
{
    public bool MfaRequired { get; init; }
    public string? MfaSession { get; init; }
    public AuthTokens? Tokens { get; init; }
}
