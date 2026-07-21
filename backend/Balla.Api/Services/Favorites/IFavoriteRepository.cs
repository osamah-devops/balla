using Balla.Api.Models;

namespace Balla.Api.Services.Favorites;

public interface IFavoriteRepository
{
    Task<IReadOnlyList<Favorite>> ListForUserAsync(string userId, CancellationToken ct);
    Task AddAsync(string userId, string productId, CancellationToken ct);
    Task RemoveAsync(string userId, string productId, CancellationToken ct);
}
