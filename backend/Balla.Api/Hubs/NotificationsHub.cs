using Balla.Api.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Balla.Api.Hubs;

/// <summary>
/// Both buyers and sellers join a group named after their own user id on connect;
/// publishers push events to that group. No client-invokable methods are needed for
/// this feature. Connect/disconnect also update <see cref="IOnlinePresenceTracker"/>
/// so offline recipients can be routed to email instead.
/// </summary>
[Authorize]
public class NotificationsHub(IOnlinePresenceTracker presenceTracker) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            presenceTracker.Connected(userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            presenceTracker.Disconnected(userId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}
