using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public static class ReportStatus
{
    public const string Open = "open";
    public const string Dismissed = "dismissed";
}

public class Report
{
    [DynamoDBHashKey("ReportId")]
    public string ReportId { get; set; } = default!;

    public string ConversationId { get; set; } = default!;
    public string ReporterId { get; set; } = default!;
    public string ReporterName { get; set; } = default!;
    public string ReportedUserId { get; set; } = default!;
    public string Reason { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;
    public string Status { get; set; } = ReportStatus.Open;
}
