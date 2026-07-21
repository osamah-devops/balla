using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Orders;

public class CheckoutItemRequest
{
    [Required]
    public required string ProductId { get; set; }

    [Range(1, 99)]
    public int Quantity { get; set; } = 1;

    public Dictionary<string, string>? SelectedOptions { get; set; }
}
