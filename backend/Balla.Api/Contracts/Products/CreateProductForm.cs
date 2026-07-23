using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Balla.Api.Contracts.Products;

public class CreateProductForm
{
    [Required, MinLength(2)]
    public required string Title { get; set; }

    [Required]
    public required string Category { get; set; }

    [Required]
    public required string CategorySlug { get; set; }

    [Required]
    public required string Price { get; set; }

    public string Currency { get; set; } = "USD";

    /// <summary>Shipping weight in pounds, used to price shipping off carrier-style weight
    /// tiers at checkout (see <see cref="Services.Payments.ShippingPricing"/>).</summary>
    [Required, Range(0.01, 10_000)]
    public required decimal WeightLbs { get; set; }

    [Required, MinLength(10)]
    public required string FullDescription { get; set; }

    public IFormFile? Image { get; set; }

    /// <summary>Up to <see cref="ProductsController.MaxExtraImages"/> additional gallery photos.</summary>
    public List<IFormFile>? ExtraImages { get; set; }

    /// <summary>JSON-encoded <c>[{ "name": "Size", "values": ["S","M","L"] }]</c>; sent as a string
    /// because the request is multipart/form-data alongside the image files.</summary>
    public string? OptionsJson { get; set; }
}
