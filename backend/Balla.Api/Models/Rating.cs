using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Rating
{
    [DynamoDBHashKey("ProductId")]
    public string ProductId { get; set; } = default!;

    [DynamoDBRangeKey("UserId")]
    public string UserId { get; set; } = default!;

    public int Stars { get; set; }
    public string CreatedAt { get; set; } = default!;
}
