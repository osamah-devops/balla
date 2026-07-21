using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Offers;

public class DynamoDbOfferRepository : IOfferRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbOfferRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.OffersTableName };
    }

    public async Task<IReadOnlyList<Offer>> ListBySellerAsync(string sellerId, CancellationToken ct)
    {
        var offers = await _context.QueryAsync<Offer>(sellerId, _config).GetRemainingAsync(ct);
        offers.Reverse();
        return offers;
    }

    public Task<Offer?> GetAsync(string sellerId, string offerId, CancellationToken ct) =>
        _context.LoadAsync<Offer?>(sellerId, offerId, _config, ct);

    public Task PutAsync(Offer offer, CancellationToken ct) => _context.SaveAsync(offer, _config, ct);
}
