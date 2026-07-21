using Balla.Api.Models;

namespace Balla.Api.Services.Orders;

public interface IOrderRepository
{
    Task<Order?> GetAsync(string orderId, CancellationToken ct);
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<Order>> ListForBuyerAsync(string buyerId, CancellationToken ct);
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<Order>> ListForSellerAsync(string sellerId, CancellationToken ct);
    Task PutAsync(Order order, CancellationToken ct);
    Task<IReadOnlyList<Order>> ListAllAsync(CancellationToken ct);
}
