using Balla.Api.Contracts.Notifications;
using Balla.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Balla.Api.Services.Notifications;

public class SignalRNotificationPublisher(IHubContext<NotificationsHub> hubContext) : INotificationPublisher
{
    public Task NotifyUserAsync(string recipientId, NotificationPayload payload, CancellationToken ct) =>
        hubContext.Clients.Group(recipientId).SendAsync("notification", payload, ct);
}
