using Balla.Api.Models;

namespace Balla.Api.Services.Comments;

public interface ICommentRepository
{
    Task<IReadOnlyList<Comment>> ListByProductAsync(string productId, CancellationToken ct);
    Task PutAsync(Comment comment, CancellationToken ct);
}
