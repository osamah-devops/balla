using Balla.Api.Contracts.Notifications;

namespace Balla.Api.Services.Notifications;

public interface ISesEmailSender
{
    Task SendNotificationEmailAsync(string recipientId, NotificationPayload payload, CancellationToken ct);
}
