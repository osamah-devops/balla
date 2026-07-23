using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Products;

/// <summary>Edits a product's listing details. Photos are set at creation and aren't
/// replaceable here yet — only text/pricing/option fields.</summary>
public class UpdateProductForm
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

    [Required, Range(0.01, 10_000)]
    public required decimal WeightLbs { get; set; }

    [Required, MinLength(10)]
    public required string FullDescription { get; set; }

    /// <summary>JSON-encoded <c>[{ "name": "Size", "values": ["S","M","L"] }]</c>.</summary>
    public string? OptionsJson { get; set; }
}
