namespace Balla.Api.Contracts.Admin;

public record ReportResponse(
    string Id,
    string ConversationId,
    string ReporterId,
    string ReporterName,
    string ReportedUserId,
    string Reason,
    string CreatedAt
);
