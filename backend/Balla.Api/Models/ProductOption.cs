namespace Balla.Api.Models;

/// <summary>A buyer-selectable variant group, e.g. Name="Size", Values=["S","M","L"].</summary>
public class ProductOption
{
    public string Name { get; set; } = default!;
    public List<string> Values { get; set; } = [];
}
