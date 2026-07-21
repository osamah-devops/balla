using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Comments;

public class CreateCommentRequest
{
    [Required, MinLength(1), MaxLength(2000)]
    public required string Body { get; set; }
}
