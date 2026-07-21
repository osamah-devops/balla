using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Favorite
{
    [DynamoDBHashKey("UserId")]
    public string UserId { get; set; } = default!;

    [DynamoDBRangeKey("ProductId")]
    public string ProductId { get; set; } = default!;

    public string CreatedAt { get; set; } = default!;
}
