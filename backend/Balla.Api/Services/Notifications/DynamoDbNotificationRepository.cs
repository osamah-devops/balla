using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Notifications;

public class DynamoDbNotificationRepository : INotificationRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbNotificationRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.NotificationsTableName };
    }

    public async Task<IReadOnlyList<PersistedNotification>> ListForUserAsync(string userId, int limit, CancellationToken ct)
    {
        // A single page (newest-first) is enough for the "recent activity" list the client renders;
        // it isn't a full history browser, so there's no need to paginate through everything.
        var config = new DynamoDBOperationConfig { OverrideTableName = _config.OverrideTableName, BackwardQuery = true };
        var page = await _context.QueryAsync<PersistedNotification>(userId, config).GetNextSetAsync(ct);
        return page.Take(limit).ToList();
    }

    public Task PutAsync(PersistedNotification notification, CancellationToken ct) => _context.SaveAsync(notification, _config, ct);

    public async Task MarkReadAsync(string userId, string notificationId, CancellationToken ct)
    {
        var notification = await _context.LoadAsync<PersistedNotification?>(userId, notificationId, _config, ct);
        if (notification is null || notification.Read)
        {
            return;
        }
        notification.Read = true;
        await _context.SaveAsync(notification, _config, ct);
    }

    public async Task MarkAllReadAsync(string userId, CancellationToken ct)
    {
        var config = new DynamoDBOperationConfig
        {
            OverrideTableName = _config.OverrideTableName,
            QueryFilter = [new ScanCondition("Read", ScanOperator.Equal, false)],
        };
        var unread = await _context.QueryAsync<PersistedNotification>(userId, config).GetRemainingAsync(ct);
        foreach (var notification in unread)
        {
            notification.Read = true;
            await _context.SaveAsync(notification, _config, ct);
        }
    }
}
