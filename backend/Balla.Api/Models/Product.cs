using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Product
{
    [DynamoDBHashKey("Id")]
    public string Id { get; set; } = default!;

    public string Category { get; set; } = default!;
    public string CategorySlug { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Price { get; set; } = default!;
    public string Currency { get; set; } = "USD";
    public string FullDescription { get; set; } = default!;
    public Dictionary<string, string>? Specifications { get; set; }
    public string Image { get; set; } = default!;
    public List<string>? ExtraImages { get; set; }
    public List<ProductOption>? Options { get; set; }

    public string OwnerId { get; set; } = default!;
    public string OwnerName { get; set; } = default!;
    public string OwnerLocation { get; set; } = default!;

    public double AverageRating { get; set; }
    public int RatingCount { get; set; }

    public string CreatedAt { get; set; } = default!;
}
