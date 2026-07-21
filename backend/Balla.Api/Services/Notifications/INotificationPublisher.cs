using Balla.Api.Contracts.Notifications;

namespace Balla.Api.Services.Notifications;

public interface INotificationPublisher
{
    /// <summary>Live push only; the caller is responsible for persistence. See <see cref="INotificationDispatcher"/>.</summary>
    Task NotifyUserAsync(string recipientId, NotificationPayload payload, CancellationToken ct);
}
