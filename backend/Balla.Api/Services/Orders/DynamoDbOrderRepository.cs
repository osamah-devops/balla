using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Orders;

public class DynamoDbOrderRepository : IOrderRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbOrderRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.OrdersTableName };
    }

    public Task<Order?> GetAsync(string orderId, CancellationToken ct) =>
        _context.LoadAsync<Order?>(orderId, _config, ct);

    public async Task<IReadOnlyList<Order>> ListForBuyerAsync(string buyerId, CancellationToken ct)
    {
        var config = new DynamoDBOperationConfig { OverrideTableName = _config.OverrideTableName, IndexName = "buyer-index" };
        var orders = await _context.QueryAsync<Order>(buyerId, config).GetRemainingAsync(ct);
        orders.Reverse();
        return orders;
    }

    public async Task<IReadOnlyList<Order>> ListForSellerAsync(string sellerId, CancellationToken ct)
    {
        var config = new DynamoDBOperationConfig { OverrideTableName = _config.OverrideTableName, IndexName = "seller-index" };
        var orders = await _context.QueryAsync<Order>(sellerId, config).GetRemainingAsync(ct);
        orders.Reverse();
        return orders;
    }

    public Task PutAsync(Order order, CancellationToken ct) => _context.SaveAsync(order, _config, ct);

    public async Task<IReadOnlyList<Order>> ListAllAsync(CancellationToken ct) =>
        await _context.ScanAsync<Order>([], _config).GetRemainingAsync(ct);
}
