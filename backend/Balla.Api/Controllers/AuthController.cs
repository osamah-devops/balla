using Balla.Api.Contracts.Auth;
using Balla.Api.Contracts.Users;
using Balla.Api.Models;
using Balla.Api.Services.Auth;
using Balla.Api.Services.Owners;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ICognitoAuthService authService, IUserProfileRepository userProfileRepository, IOwnerRepository ownerRepository)
    : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var userId = await authService.SignUpAsync(request.Email, request.Password, request.Name, ct);
        var isSeller = !string.IsNullOrWhiteSpace(request.StoreName);

        var profile = new UserProfile
        {
            UserId = userId,
            Name = request.Name,
            Email = request.Email,
            ZipCode = request.ZipCode,
            State = request.State,
            Role = isSeller ? "seller" : "customer",
            Status = "active",
            JoinedDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            OwnerId = isSeller ? userId : null,
        };
        await userProfileRepository.PutAsync(profile, ct);

        if (isSeller)
        {
            var owner = new Owner
            {
                Id = userId,
                Name = request.StoreName!,
                Location = request.ZipCode,
                Rating = 0,
                Reviews = 0,
                MemberSince = DateTime.UtcNow.Year,
                Verified = false,
            };
            await ownerRepository.PutAsync(owner, ct);
        }

        return Ok(new RegisterResponse(userId));
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(ConfirmRegistrationRequest request, CancellationToken ct)
    {
        await authService.ConfirmSignUpAsync(request.Email, request.Code, ct);
        return NoContent();
    }

    [HttpPost("resend-code")]
    public async Task<IActionResult> ResendCode(ResendConfirmationCodeRequest request, CancellationToken ct)
    {
        await authService.ResendConfirmationCodeAsync(request.Email, ct);
        return NoContent();
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var tokens = await authService.LoginAsync(request.Email, request.Password, ct);
        var userId = await authService.GetUserIdAsync(tokens.AccessToken, ct);

        var profile = await userProfileRepository.GetAsync(userId, ct);
        if (profile is null)
        {
            throw new AuthException("PROFILE_NOT_FOUND", 404, "No profile found for this account.");
        }
        if (profile.Status == "suspended")
        {
            throw new AuthException("ACCOUNT_SUSPENDED", 403, "This account has been suspended.");
        }

        return Ok(new LoginResponse(tokens.AccessToken, tokens.IdToken, tokens.RefreshToken, tokens.ExpiresIn, profile.ToResponse()));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthTokensResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var tokens = await authService.RefreshAsync(request.RefreshToken, ct);

        var userId = await authService.GetUserIdAsync(tokens.AccessToken, ct);
        var profile = await userProfileRepository.GetAsync(userId, ct);
        if (profile?.Status == "suspended")
        {
            throw new AuthException("ACCOUNT_SUSPENDED", 403, "This account has been suspended.");
        }

        return Ok(new AuthTokensResponse(tokens.AccessToken, tokens.IdToken, tokens.RefreshToken, tokens.ExpiresIn));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken ct)
    {
        await authService.ForgotPasswordAsync(request.Email, ct);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken ct)
    {
        await authService.ConfirmForgotPasswordAsync(request.Email, request.Code, request.NewPassword, ct);
        return NoContent();
    }
}
