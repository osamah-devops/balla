using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Messaging;

public class DynamoDbConversationMessageRepository : IConversationMessageRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbConversationMessageRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.ConversationMessagesTableName };
    }

    public async Task<IReadOnlyList<ConversationMessage>> ListAsync(string conversationId, CancellationToken ct)
    {
        // MessageId sort keys are ISO-timestamp prefixed, so ascending query order is already chronological.
        return await _context.QueryAsync<ConversationMessage>(conversationId, _config).GetRemainingAsync(ct);
    }

    public Task PutAsync(ConversationMessage message, CancellationToken ct) => _context.SaveAsync(message, _config, ct);
}
