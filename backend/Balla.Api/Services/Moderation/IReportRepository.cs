using Balla.Api.Models;

namespace Balla.Api.Services.Moderation;

public interface IReportRepository
{
    Task PutAsync(Report report, CancellationToken ct);
    Task<Report?> GetAsync(string reportId, CancellationToken ct);
    Task<IReadOnlyList<Report>> ListAllAsync(CancellationToken ct);
}
