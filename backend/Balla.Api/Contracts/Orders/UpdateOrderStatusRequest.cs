using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Orders;

public class UpdateOrderStatusRequest
{
    [Required, RegularExpression("^(shipped|delivered|cancelled)$")]
    public required string Status { get; set; }
}
