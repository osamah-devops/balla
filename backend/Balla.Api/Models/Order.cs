using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public static class OrderStatus
{
    public const string PendingPayment = "pending_payment";
    public const string Paid = "paid";
    public const string Shipped = "shipped";
    public const string Delivered = "delivered";
    public const string Cancelled = "cancelled";
}

public class OrderItem
{
    public string ProductId { get; set; } = default!;
    public string ProductTitle { get; set; } = default!;
    public string ProductImage { get; set; } = default!;
    public long UnitPriceCents { get; set; }
    public int Quantity { get; set; }
    public Dictionary<string, string>? SelectedOptions { get; set; }
}

public class Order
{
    [DynamoDBHashKey("OrderId")]
    public string OrderId { get; set; } = default!;

    public string BuyerId { get; set; } = default!;
    public string BuyerName { get; set; } = default!;
    public string SellerId { get; set; } = default!;
    public string SellerName { get; set; } = default!;
    public List<OrderItem> Items { get; set; } = [];
    public long ShippingCents { get; set; }
    public long TotalCents { get; set; }
    public string Currency { get; set; } = "usd";
    public string Status { get; set; } = OrderStatus.PendingPayment;
    public string? StripeCheckoutSessionId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string CreatedAt { get; set; } = default!;
    public string UpdatedAt { get; set; } = default!;
}
