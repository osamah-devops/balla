using Balla.Api.Models;

namespace Balla.Api.Services.Products;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> ListAsync(CancellationToken ct);
    Task<Product?> GetAsync(string id, CancellationToken ct);
    Task PutAsync(Product product, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}
