using Balla.Api.Contracts.Notifications;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Authorize]
[Route("api/notifications")]
public class NotificationsController(
    IUserProfileRepository userProfileRepository,
    INotificationRepository notificationRepository)
    : BallaControllerBase(userProfileRepository)
{
    private const int ListLimit = 50;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationResponse>>> List(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Ok(Array.Empty<NotificationResponse>());
        }

        var notifications = await notificationRepository.ListForUserAsync(userId, ListLimit, ct);
        return Ok(notifications.Select(n => n.ToResponse()));
    }

    [HttpPost("{notificationId}/read")]
    public async Task<IActionResult> MarkRead(string notificationId, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return NotFound();
        }

        await notificationRepository.MarkReadAsync(userId, notificationId, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return NotFound();
        }

        await notificationRepository.MarkAllReadAsync(userId, ct);
        return NoContent();
    }
}
