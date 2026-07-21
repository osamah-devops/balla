namespace Balla.Api.Contracts.Offers;

public record OfferResponse(
    string Id,
    string SellerId,
    string ProductId,
    string ProductTitle,
    string BuyerId,
    string BuyerName,
    decimal Amount,
    string? Note,
    string Status,
    string CreatedAt
);
