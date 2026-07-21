using System.Security.Claims;
using Balla.Api.Models;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[ApiController]
public abstract class BallaControllerBase(IUserProfileRepository userProfileRepository) : ControllerBase
{
    protected string? CurrentUserId => User.FindFirstValue("sub");

    protected async Task<UserProfile?> GetCurrentProfileAsync(CancellationToken ct)
    {
        var userId = CurrentUserId;
        return string.IsNullOrEmpty(userId) ? null : await userProfileRepository.GetAsync(userId, ct);
    }
}
