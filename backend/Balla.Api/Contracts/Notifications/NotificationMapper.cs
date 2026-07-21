using Balla.Api.Models;

namespace Balla.Api.Contracts.Notifications;

public static class NotificationMapper
{
    public static NotificationPayload ToPayload(this PersistedNotification notification) => new(
        notification.NotificationId, notification.Type, notification.RecipientId, notification.ConversationId,
        notification.ProductId, notification.ProductTitle, notification.Message, notification.CreatedAt, notification.Read
    );

    public static NotificationResponse ToResponse(this PersistedNotification notification) => new(
        notification.NotificationId, notification.Type, notification.ConversationId,
        notification.ProductId, notification.ProductTitle, notification.Message, notification.CreatedAt, notification.Read
    );
}
