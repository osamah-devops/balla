using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Products;

public class DynamoDbProductRepository : IProductRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbProductRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.ProductsTableName };
    }

    public async Task<IReadOnlyList<Product>> ListAsync(CancellationToken ct) =>
        await _context.ScanAsync<Product>([], _config).GetRemainingAsync(ct);

    public Task<Product?> GetAsync(string id, CancellationToken ct) => _context.LoadAsync<Product?>(id, _config, ct);

    public Task PutAsync(Product product, CancellationToken ct) => _context.SaveAsync(product, _config, ct);

    public Task DeleteAsync(string id, CancellationToken ct) => _context.DeleteAsync<Product>(id, _config, ct);
}
