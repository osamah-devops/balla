using Balla.Api.Models;

namespace Balla.Api.Services.Offers;

public interface IOfferRepository
{
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<Offer>> ListBySellerAsync(string sellerId, CancellationToken ct);
    Task<Offer?> GetAsync(string sellerId, string offerId, CancellationToken ct);
    Task PutAsync(Offer offer, CancellationToken ct);
}
