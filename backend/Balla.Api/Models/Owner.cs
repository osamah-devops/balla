using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Owner
{
    [DynamoDBHashKey("Id")]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string Location { get; set; } = default!;
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public int MemberSince { get; set; }
    public bool Verified { get; set; }
}
