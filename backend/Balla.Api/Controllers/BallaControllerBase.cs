using System.Security.Claims;
using Balla.Api.Models;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[ApiController]
public abstract class BallaControllerBase(IUserProfileRepository userProfileRepository) : ControllerBase
{
    protected string? CurrentUserId => User.FindFirstValue("sub");

    /// <summary>The raw bearer token, needed for Cognito calls (ChangePassword, MFA setup)
    /// that take an AccessToken parameter directly rather than relying on ASP.NET Core's
    /// validated claims principal.</summary>
    protected string CurrentAccessToken
    {
        get
        {
            var header = Request.Headers.Authorization.ToString();
            return header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? header["Bearer ".Length..] : header;
        }
    }

    protected async Task<UserProfile?> GetCurrentProfileAsync(CancellationToken ct)
    {
        var userId = CurrentUserId;
        return string.IsNullOrEmpty(userId) ? null : await userProfileRepository.GetAsync(userId, ct);
    }
}
