using Balla.Api.Models;

namespace Balla.Api.Contracts.Products;

public static class ProductMapper
{
    public static ProductResponse ToResponse(this Product product) => new(
        product.Id,
        product.Category,
        product.CategorySlug,
        product.Title,
        product.Price,
        product.Currency,
        product.FullDescription,
        product.Specifications,
        product.Image,
        product.ExtraImages,
        product.Options?.Select(o => new ProductOptionResponse(o.Name, o.Values)).ToList(),
        new ProductOwnerResponse(product.OwnerId, product.OwnerName, product.OwnerLocation),
        product.AverageRating,
        product.RatingCount
    );
}
