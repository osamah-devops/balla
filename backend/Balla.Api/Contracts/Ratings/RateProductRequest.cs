using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Ratings;

public class RateProductRequest
{
    [Range(1, 5)]
    public int Stars { get; set; }
}
