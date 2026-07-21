using Balla.Api.Models;

namespace Balla.Api.Services.Messaging;

public interface IConversationMessageRepository
{
    /// <summary>Oldest first (chronological).</summary>
    Task<IReadOnlyList<ConversationMessage>> ListAsync(string conversationId, CancellationToken ct);
    Task PutAsync(ConversationMessage message, CancellationToken ct);
}
