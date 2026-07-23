using Balla.Api.Contracts.Notifications;
using Balla.Api.Contracts.Orders;
using Balla.Api.Models;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Orders;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Authorize]
[Route("api/orders")]
public class OrdersController(
    IUserProfileRepository userProfileRepository,
    IOrderRepository orderRepository,
    INotificationDispatcher notificationDispatcher)
    : BallaControllerBase(userProfileRepository)
{
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> Mine(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return Ok(Array.Empty<OrderResponse>());
        }

        var orders = await orderRepository.ListForBuyerAsync(profile.UserId, ct);
        return Ok(orders.Where(o => o.Status != OrderStatus.PendingPayment).Select(o => o.ToResponse()));
    }

    [HttpGet("selling")]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> Selling(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null || string.IsNullOrEmpty(profile.OwnerId))
        {
            return Ok(Array.Empty<OrderResponse>());
        }

        var orders = await orderRepository.ListForSellerAsync(profile.OwnerId, ct);
        return Ok(orders.Where(o => o.Status != OrderStatus.PendingPayment).Select(o => o.ToResponse()));
    }

    [HttpPatch("{orderId}/status")]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(string orderId, UpdateOrderStatusRequest request, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var order = await orderRepository.GetAsync(orderId, ct);
        if (order is null)
        {
            return NotFound();
        }

        var isSeller = !string.IsNullOrEmpty(profile.OwnerId) && order.SellerId == profile.OwnerId;
        var isBuyer = order.BuyerId == profile.UserId;
        if (!isSeller && !isBuyer)
        {
            return NotFound();
        }
        // Buyers may only cancel their own order; shipping/delivery updates stay seller-only.
        if (isBuyer && !isSeller && request.Status != OrderStatus.Cancelled)
        {
            return StatusCode(403, new { error = "FORBIDDEN", message = "Only the seller can update this order's status." });
        }
        if (!IsValidTransition(order.Status, request.Status))
        {
            return Conflict(new { error = "INVALID_TRANSITION", message = $"Can't move an order from {order.Status} to {request.Status}." });
        }

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow.ToString("O");
        await orderRepository.PutAsync(order, ct);

        var (recipientId, message) = isSeller
            ? (order.BuyerId, $"Your order from {order.SellerName} is now {request.Status}")
            : (order.SellerId, $"{order.BuyerName} cancelled their order");

        await notificationDispatcher.DispatchAsync(
            recipientId,
            NotificationType.Order,
            message,
            conversationId: null,
            productId: null,
            productTitle: null,
            ct);

        return Ok(order.ToResponse());
    }

    private static bool IsValidTransition(string from, string to) => (from, to) switch
    {
        (OrderStatus.Paid, OrderStatus.Shipped) => true,
        (OrderStatus.Paid, OrderStatus.Cancelled) => true,
        (OrderStatus.Shipped, OrderStatus.Delivered) => true,
        _ => false,
    };
}
