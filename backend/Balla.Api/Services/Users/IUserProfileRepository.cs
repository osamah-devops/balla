using Balla.Api.Models;

namespace Balla.Api.Services.Users;

public interface IUserProfileRepository
{
    Task PutAsync(UserProfile profile, CancellationToken ct);
    Task<UserProfile?> GetAsync(string userId, CancellationToken ct);
}
