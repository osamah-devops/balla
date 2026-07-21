namespace Balla.Api.Contracts.Products;

public record ProductOwnerResponse(string Id, string Name, string Location);

public record ProductOptionResponse(string Name, IReadOnlyList<string> Values);

public record ProductResponse(
    string Id,
    string Category,
    string CategorySlug,
    string Title,
    string Price,
    string Currency,
    string FullDescription,
    Dictionary<string, string>? Specifications,
    string Image,
    IReadOnlyList<string>? ExtraImages,
    IReadOnlyList<ProductOptionResponse>? Options,
    ProductOwnerResponse Owner,
    double AverageRating,
    int RatingCount
);
