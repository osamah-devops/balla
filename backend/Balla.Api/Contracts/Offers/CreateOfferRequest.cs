using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Offers;

public class CreateOfferRequest
{
    [Required]
    public required string ProductId { get; set; }

    [Range(0.01, 1_000_000)]
    public decimal Amount { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}
