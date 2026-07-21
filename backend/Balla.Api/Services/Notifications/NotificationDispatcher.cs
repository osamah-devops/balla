using Balla.Api.Contracts.Notifications;
using Balla.Api.Models;

namespace Balla.Api.Services.Notifications;

public class NotificationDispatcher(
    INotificationRepository notificationRepository,
    INotificationPublisher notificationPublisher,
    IOnlinePresenceTracker presenceTracker,
    ISesEmailSender emailSender) : INotificationDispatcher
{
    public async Task DispatchAsync(
        string recipientId,
        string type,
        string message,
        string? conversationId,
        string? productId,
        string? productTitle,
        CancellationToken ct)
    {
        var notification = new PersistedNotification
        {
            RecipientId = recipientId,
            NotificationId = $"{DateTime.UtcNow:O}#{Guid.NewGuid():N}",
            Type = type,
            ConversationId = conversationId,
            ProductId = productId,
            ProductTitle = productTitle,
            Message = message,
            CreatedAt = DateTime.UtcNow.ToString("O"),
            Read = false,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(90).ToUnixTimeSeconds(),
        };
        await notificationRepository.PutAsync(notification, ct);

        var payload = notification.ToPayload();
        await notificationPublisher.NotifyUserAsync(recipientId, payload, ct);

        if (!presenceTracker.IsOnline(recipientId))
        {
            await emailSender.SendNotificationEmailAsync(recipientId, payload, ct);
        }
    }
}
