namespace Balla.Api.Services.Notifications;

public interface INotificationDispatcher
{
    /// <summary>Persists the notification, pushes it live over SignalR, and emails the
    /// recipient via SES if they aren't currently connected.</summary>
    Task DispatchAsync(
        string recipientId,
        string type,
        string message,
        string? conversationId,
        string? productId,
        string? productTitle,
        CancellationToken ct);
}
