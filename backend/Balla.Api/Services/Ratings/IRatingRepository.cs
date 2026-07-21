using Balla.Api.Models;

namespace Balla.Api.Services.Ratings;

public interface IRatingRepository
{
    Task<IReadOnlyList<Rating>> ListByProductAsync(string productId, CancellationToken ct);
    Task PutAsync(Rating rating, CancellationToken ct);
}
