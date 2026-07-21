using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class UserProfile
{
    [DynamoDBHashKey("UserId")]
    public string UserId { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Role { get; set; } = "customer";
    public string Status { get; set; } = "active";
    public string ZipCode { get; set; } = default!;
    public string State { get; set; } = default!;
    public string? ProfileImageUrl { get; set; }
    public string JoinedDate { get; set; } = default!;

    /// <summary>Present when Role is "seller"; also the storefront's Owner.Id.</summary>
    public string? OwnerId { get; set; }
}
