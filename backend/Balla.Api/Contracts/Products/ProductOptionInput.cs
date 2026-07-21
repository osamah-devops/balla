namespace Balla.Api.Contracts.Products;

/// <summary>Shape of each entry in <see cref="CreateProductForm.OptionsJson"/>.</summary>
public record ProductOptionInput(string Name, List<string> Values);
