using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Orders;

public class CheckoutRequest
{
    [Required, MinLength(1)]
    public required List<CheckoutItemRequest> Items { get; set; }
}
