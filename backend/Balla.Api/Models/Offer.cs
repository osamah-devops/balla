using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public static class OfferStatus
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Rejected = "rejected";
}

public class Offer
{
    [DynamoDBHashKey("SellerId")]
    public string SellerId { get; set; } = default!;

    [DynamoDBRangeKey("OfferId")]
    public string OfferId { get; set; } = default!;

    public string ProductId { get; set; } = default!;
    public string ProductTitle { get; set; } = default!;
    public string BuyerId { get; set; } = default!;
    public string BuyerName { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = OfferStatus.Pending;
    public string CreatedAt { get; set; } = default!;
}
