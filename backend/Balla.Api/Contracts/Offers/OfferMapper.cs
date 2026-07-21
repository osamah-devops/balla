using Balla.Api.Models;

namespace Balla.Api.Contracts.Offers;

public static class OfferMapper
{
    public static OfferResponse ToResponse(this Offer offer) => new(
        offer.OfferId, offer.SellerId, offer.ProductId, offer.ProductTitle,
        offer.BuyerId, offer.BuyerName, offer.Amount, offer.Note, offer.Status, offer.CreatedAt
    );
}
