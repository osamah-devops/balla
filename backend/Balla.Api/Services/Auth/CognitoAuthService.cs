using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Auth;

public class CognitoAuthService(IAmazonCognitoIdentityProvider client, IOptions<CognitoOptions> options)
    : ICognitoAuthService
{
    private readonly CognitoOptions _options = options.Value;

    public async Task<string> SignUpAsync(string email, string password, string name, CancellationToken ct)
    {
        var request = new SignUpRequest
        {
            ClientId = _options.ClientId,
            Username = email,
            Password = password,
            UserAttributes =
            [
                new AttributeType { Name = "email", Value = email },
                new AttributeType { Name = "name", Value = name },
            ],
        };

        try
        {
            var response = await client.SignUpAsync(request, ct);
            return response.UserSub;
        }
        catch (UsernameExistsException ex)
        {
            throw new AuthException("EMAIL_ALREADY_REGISTERED", 409, "An account with this email already exists.", ex);
        }
        catch (InvalidPasswordException ex)
        {
            throw new AuthException("INVALID_PASSWORD", 400, "Password does not meet the required policy.", ex);
        }
        catch (InvalidParameterException ex)
        {
            throw new AuthException("INVALID_REQUEST", 400, ex.Message, ex);
        }
    }

    public async Task ConfirmSignUpAsync(string email, string code, CancellationToken ct)
    {
        var request = new ConfirmSignUpRequest
        {
            ClientId = _options.ClientId,
            Username = email,
            ConfirmationCode = code,
        };

        try
        {
            await client.ConfirmSignUpAsync(request, ct);
        }
        catch (CodeMismatchException ex)
        {
            throw new AuthException("INVALID_CODE", 400, "That code is invalid.", ex);
        }
        catch (ExpiredCodeException ex)
        {
            throw new AuthException("CODE_EXPIRED", 400, "That code has expired.", ex);
        }
        catch (NotAuthorizedException ex)
        {
            throw new AuthException("ALREADY_CONFIRMED", 400, "This account is already confirmed.", ex);
        }
        catch (UserNotFoundException ex)
        {
            throw new AuthException("USER_NOT_FOUND", 404, "No account found for this email.", ex);
        }
    }

    public async Task ResendConfirmationCodeAsync(string email, CancellationToken ct)
    {
        var request = new ResendConfirmationCodeRequest
        {
            ClientId = _options.ClientId,
            Username = email,
        };

        try
        {
            await client.ResendConfirmationCodeAsync(request, ct);
        }
        catch (UserNotFoundException ex)
        {
            throw new AuthException("USER_NOT_FOUND", 404, "No account found for this email.", ex);
        }
    }

    public async Task<LoginOutcome> LoginAsync(string email, string password, CancellationToken ct)
    {
        var request = new InitiateAuthRequest
        {
            ClientId = _options.ClientId,
            AuthFlow = AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters = new Dictionary<string, string>
            {
                ["USERNAME"] = email,
                ["PASSWORD"] = password,
            },
        };

        try
        {
            var response = await client.InitiateAuthAsync(request, ct);
            if (response.ChallengeName == ChallengeNameType.SOFTWARE_TOKEN_MFA)
            {
                return new LoginOutcome { MfaRequired = true, MfaSession = response.Session };
            }
            return new LoginOutcome { Tokens = ToAuthTokens(response.AuthenticationResult) };
        }
        catch (UserNotConfirmedException ex)
        {
            throw new AuthException("USER_NOT_CONFIRMED", 403, "Please confirm your email before signing in.", ex);
        }
        catch (NotAuthorizedException ex)
        {
            throw new AuthException("INVALID_CREDENTIALS", 401, "Incorrect email or password.", ex);
        }
        catch (UserNotFoundException ex)
        {
            throw new AuthException("INVALID_CREDENTIALS", 401, "Incorrect email or password.", ex);
        }
    }

    public async Task<AuthTokens> RespondToMfaChallengeAsync(string email, string session, string code, CancellationToken ct)
    {
        var request = new RespondToAuthChallengeRequest
        {
            ClientId = _options.ClientId,
            ChallengeName = ChallengeNameType.SOFTWARE_TOKEN_MFA,
            Session = session,
            ChallengeResponses = new Dictionary<string, string>
            {
                ["USERNAME"] = email,
                ["SOFTWARE_TOKEN_MFA_CODE"] = code,
            },
        };

        try
        {
            var response = await client.RespondToAuthChallengeAsync(request, ct);
            return ToAuthTokens(response.AuthenticationResult);
        }
        catch (CodeMismatchException ex)
        {
            throw new AuthException("INVALID_CODE", 400, "That code is invalid.", ex);
        }
        catch (ExpiredCodeException ex)
        {
            throw new AuthException("CODE_EXPIRED", 400, "That code has expired.", ex);
        }
        catch (NotAuthorizedException ex)
        {
            throw new AuthException("SESSION_EXPIRED", 401, "Your session has expired. Please sign in again.", ex);
        }
    }

    public async Task<string> AssociateSoftwareTokenAsync(string accessToken, CancellationToken ct)
    {
        var response = await client.AssociateSoftwareTokenAsync(new AssociateSoftwareTokenRequest { AccessToken = accessToken }, ct);
        return response.SecretCode;
    }

    public async Task VerifySoftwareTokenAsync(string accessToken, string code, CancellationToken ct)
    {
        var request = new VerifySoftwareTokenRequest { AccessToken = accessToken, UserCode = code };
        try
        {
            var response = await client.VerifySoftwareTokenAsync(request, ct);
            if (response.Status != VerifySoftwareTokenResponseType.SUCCESS)
            {
                throw new AuthException("INVALID_CODE", 400, "That code is invalid.");
            }
        }
        catch (EnableSoftwareTokenMFAException ex)
        {
            throw new AuthException("INVALID_CODE", 400, "That code is invalid.", ex);
        }
        catch (CodeMismatchException ex)
        {
            throw new AuthException("INVALID_CODE", 400, "That code is invalid.", ex);
        }
    }

    public Task SetSoftwareTokenMfaEnabledAsync(string accessToken, bool enabled, CancellationToken ct)
    {
        var request = new SetUserMFAPreferenceRequest
        {
            AccessToken = accessToken,
            SoftwareTokenMfaSettings = new SoftwareTokenMfaSettingsType { Enabled = enabled, PreferredMfa = enabled },
        };
        return client.SetUserMFAPreferenceAsync(request, ct);
    }

    public async Task<bool> IsSoftwareTokenMfaEnabledAsync(string accessToken, CancellationToken ct)
    {
        var response = await client.GetUserAsync(new GetUserRequest { AccessToken = accessToken }, ct);
        return response.UserMFASettingList?.Contains("SOFTWARE_TOKEN_MFA") ?? false;
    }

    public async Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var request = new InitiateAuthRequest
        {
            ClientId = _options.ClientId,
            AuthFlow = AuthFlowType.REFRESH_TOKEN_AUTH,
            AuthParameters = new Dictionary<string, string>
            {
                ["REFRESH_TOKEN"] = refreshToken,
            },
        };

        try
        {
            var response = await client.InitiateAuthAsync(request, ct);
            return ToAuthTokens(response.AuthenticationResult, refreshToken);
        }
        catch (NotAuthorizedException ex)
        {
            throw new AuthException("SESSION_EXPIRED", 401, "Your session has expired. Please sign in again.", ex);
        }
    }

    public async Task<string> GetUserIdAsync(string accessToken, CancellationToken ct)
    {
        var response = await client.GetUserAsync(new GetUserRequest { AccessToken = accessToken }, ct);
        return response.UserAttributes.First(a => a.Name == "sub").Value;
    }

    public async Task ForgotPasswordAsync(string email, CancellationToken ct)
    {
        var request = new ForgotPasswordRequest { ClientId = _options.ClientId, Username = email };
        try
        {
            await client.ForgotPasswordAsync(request, ct);
        }
        catch (UserNotFoundException)
        {
            // Don't leak account existence to the caller; treat as success either way.
        }
    }

    public async Task ConfirmForgotPasswordAsync(string email, string code, string newPassword, CancellationToken ct)
    {
        var request = new ConfirmForgotPasswordRequest
        {
            ClientId = _options.ClientId,
            Username = email,
            ConfirmationCode = code,
            Password = newPassword,
        };

        try
        {
            await client.ConfirmForgotPasswordAsync(request, ct);
        }
        catch (CodeMismatchException ex)
        {
            throw new AuthException("INVALID_CODE", 400, "That code is invalid.", ex);
        }
        catch (ExpiredCodeException ex)
        {
            throw new AuthException("CODE_EXPIRED", 400, "That code has expired.", ex);
        }
        catch (InvalidPasswordException ex)
        {
            throw new AuthException("INVALID_PASSWORD", 400, "Password does not meet the required policy.", ex);
        }
    }

    public async Task ChangePasswordAsync(string accessToken, string currentPassword, string newPassword, CancellationToken ct)
    {
        var request = new ChangePasswordRequest
        {
            AccessToken = accessToken,
            PreviousPassword = currentPassword,
            ProposedPassword = newPassword,
        };

        try
        {
            await client.ChangePasswordAsync(request, ct);
        }
        catch (NotAuthorizedException ex)
        {
            throw new AuthException("INVALID_CREDENTIALS", 401, "Your current password is incorrect.", ex);
        }
        catch (InvalidPasswordException ex)
        {
            throw new AuthException("INVALID_PASSWORD", 400, "New password does not meet the required policy.", ex);
        }
        catch (LimitExceededException ex)
        {
            throw new AuthException("TOO_MANY_ATTEMPTS", 429, "Too many attempts. Please try again later.", ex);
        }
    }

    private static AuthTokens ToAuthTokens(AuthenticationResultType? result, string? fallbackRefreshToken = null)
    {
        if (result is null)
        {
            throw new AuthException("AUTH_CHALLENGE_REQUIRED", 501, "Additional authentication challenge is required.");
        }

        return new AuthTokens(result.AccessToken, result.IdToken, result.RefreshToken ?? fallbackRefreshToken, result.ExpiresIn ?? 0);
    }
}
