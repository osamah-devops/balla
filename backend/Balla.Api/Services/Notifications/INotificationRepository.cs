using Balla.Api.Models;

namespace Balla.Api.Services.Notifications;

public interface INotificationRepository
{
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<PersistedNotification>> ListForUserAsync(string userId, int limit, CancellationToken ct);
    Task PutAsync(PersistedNotification notification, CancellationToken ct);
    Task MarkReadAsync(string userId, string notificationId, CancellationToken ct);
    Task MarkAllReadAsync(string userId, CancellationToken ct);
}
