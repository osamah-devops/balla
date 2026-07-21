using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Moderation;

public class DynamoDbReportRepository : IReportRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbReportRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.ReportsTableName };
    }

    public Task PutAsync(Report report, CancellationToken ct) => _context.SaveAsync(report, _config, ct);

    public async Task<IReadOnlyList<Report>> ListAllAsync(CancellationToken ct) =>
        await _context.ScanAsync<Report>([], _config).GetRemainingAsync(ct);
}
