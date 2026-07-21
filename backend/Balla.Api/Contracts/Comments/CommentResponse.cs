namespace Balla.Api.Contracts.Comments;

public record CommentResponse(string Id, string ProductId, string AuthorId, string AuthorName, string Body, string CreatedAt);
