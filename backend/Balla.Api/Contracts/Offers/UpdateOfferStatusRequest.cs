using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Offers;

public class UpdateOfferStatusRequest
{
    [Required, RegularExpression("^(accepted|rejected)$")]
    public required string Status { get; set; }
}
