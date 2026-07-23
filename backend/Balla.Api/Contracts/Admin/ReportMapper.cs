using Balla.Api.Models;

namespace Balla.Api.Contracts.Admin;

public static class ReportMapper
{
    public static ReportResponse ToResponse(this Report report) => new(
        report.ReportId, report.ConversationId, report.ReporterId, report.ReporterName,
        report.ReportedUserId, report.Reason, report.CreatedAt, report.Status
    );
}
