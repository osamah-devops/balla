using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Comment
{
    [DynamoDBHashKey("ProductId")]
    public string ProductId { get; set; } = default!;

    [DynamoDBRangeKey("CommentId")]
    public string CommentId { get; set; } = default!;

    public string AuthorId { get; set; } = default!;
    public string AuthorName { get; set; } = default!;
    public string Body { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;
}
