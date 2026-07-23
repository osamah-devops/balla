namespace Balla.Api.Contracts.Orders;

public record OrderItemResponse(
    string ProductId,
    string ProductTitle,
    string ProductImage,
    long UnitPriceCents,
    int Quantity,
    Dictionary<string, string>? SelectedOptions
);

public record OrderResponse(
    string Id,
    string BuyerId,
    string BuyerName,
    string SellerId,
    string SellerName,
    IReadOnlyList<OrderItemResponse> Items,
    long ShippingCents,
    long TotalCents,
    string Currency,
    string Status,
    string CreatedAt,
    string UpdatedAt
);
