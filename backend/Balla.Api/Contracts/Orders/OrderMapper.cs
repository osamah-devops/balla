using Balla.Api.Models;

namespace Balla.Api.Contracts.Orders;

public static class OrderMapper
{
    public static OrderResponse ToResponse(this Order order) => new(
        order.OrderId, order.BuyerId, order.BuyerName, order.SellerId, order.SellerName,
        order.Items.Select(i => new OrderItemResponse(i.ProductId, i.ProductTitle, i.ProductImage, i.UnitPriceCents, i.Quantity, i.SelectedOptions)).ToList(),
        order.TotalCents, order.Currency, order.Status, order.CreatedAt, order.UpdatedAt
    );
}
