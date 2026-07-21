using Balla.Api.Models;

namespace Balla.Api.Contracts.Comments;

public static class CommentMapper
{
    public static CommentResponse ToResponse(this Comment comment) =>
        new(comment.CommentId, comment.ProductId, comment.AuthorId, comment.AuthorName, comment.Body, comment.CreatedAt);
}
