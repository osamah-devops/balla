using Balla.Api.Contracts.Users;

namespace Balla.Api.Contracts.Auth;

/// <summary>Either an MFA challenge (MfaRequired=true, MfaSession set, everything else
/// null) or a completed login (MfaRequired=false, tokens + user set).</summary>
public record LoginResponse(
    bool MfaRequired,
    string? MfaSession,
    string? AccessToken,
    string? IdToken,
    string? RefreshToken,
    int? ExpiresIn,
    UserProfileResponse? User
);
