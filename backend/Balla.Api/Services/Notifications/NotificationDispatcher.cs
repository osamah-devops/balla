using Balla.Api.Contracts.Notifications;
using Balla.Api.Models;

namespace Balla.Api.Services.Notifications;

public class NotificationDispatcher(
    INotificationRepository notificationRepository,
    INotificationPublisher notificationPublisher,
    IOnlinePresenceTracker presenceTracker,
    ISesEmailSender emailSender,
    ILogger<NotificationDispatcher> logger) : INotificationDispatcher
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
            // Best-effort side channel: the notification is already persisted and
            // published above, so a flaky/unauthorized email send (e.g. SES sandbox
            // rejecting an unverified recipient) must not fail the caller's request.
            try
            {
                await emailSender.SendNotificationEmailAsync(recipientId, payload, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Failed to send notification email to {RecipientId}", recipientId);
            }
        }
    }
}
