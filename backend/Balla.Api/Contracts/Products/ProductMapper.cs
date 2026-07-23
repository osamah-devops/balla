using Balla.Api.Models;
using Balla.Api.Services.Payments;

namespace Balla.Api.Contracts.Products;

public static class ProductMapper
{
    public static ProductResponse ToResponse(this Product product) => new(
        product.Id,
        product.Category,
        product.CategorySlug,
        product.Title,
        CommissionPricing.ApplyToDisplayPrice(product.Price),
        product.Currency,
        product.WeightLbs,
        product.FullDescription,
        product.Specifications,
        product.Image,
        product.ExtraImages,
        product.Options?.Select(o => new ProductOptionResponse(o.Name, o.Values)).ToList(),
        new ProductOwnerResponse(product.OwnerId, product.OwnerName, product.OwnerLocation, product.OwnerState, product.OwnerZip),
        product.AverageRating,
        product.RatingCount,
        product.Hidden,
        product.CreatedAt
    );
}
