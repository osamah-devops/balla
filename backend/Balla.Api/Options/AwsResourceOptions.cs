namespace Balla.Api.Options;

public class AwsResourceOptions
{
    public const string SectionName = "AwsResources";

    public required string UsersTableName { get; set; }
    public required string ProductsTableName { get; set; }
    public required string OwnersTableName { get; set; }
    public required string CommentsTableName { get; set; }
    public required string RatingsTableName { get; set; }
    public required string ConversationsTableName { get; set; }
    public required string ConversationMessagesTableName { get; set; }
    public required string NotificationsTableName { get; set; }
    public required string OffersTableName { get; set; }
    public required string UploadsBucketName { get; set; }

    /// <summary>Base URL (e.g. the CloudFront domain) uploaded images are served from.</summary>
    public required string PublicAssetsBaseUrl { get; set; }
}
