namespace Balla.Api.Services.Notifications;

public interface IOnlinePresenceTracker
{
    void Connected(string userId);
    void Disconnected(string userId);
    bool IsOnline(string userId);
}
