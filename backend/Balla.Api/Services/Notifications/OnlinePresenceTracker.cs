using System.Collections.Concurrent;

namespace Balla.Api.Services.Notifications;

/// <summary>
/// In-process connection-count tracking (a user can have multiple tabs/reconnects open).
/// Correct as long as the API runs as a single instance; scaling to multiple ECS tasks
/// would need a shared backplane (e.g. Redis) for this to stay accurate.
/// </summary>
public class OnlinePresenceTracker : IOnlinePresenceTracker
{
    private readonly ConcurrentDictionary<string, int> _connectionCounts = new();

    public void Connected(string userId) => _connectionCounts.AddOrUpdate(userId, 1, (_, count) => count + 1);

    public void Disconnected(string userId) =>
        _connectionCounts.AddOrUpdate(userId, 0, (_, count) => Math.Max(0, count - 1));

    public bool IsOnline(string userId) => _connectionCounts.TryGetValue(userId, out var count) && count > 0;
}
