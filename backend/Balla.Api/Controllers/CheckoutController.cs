using Balla.Api.Contracts.Notifications;
using Balla.Api.Contracts.Orders;
using Balla.Api.Models;
using Balla.Api.Options;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Orders;
using Balla.Api.Services.Payments;
using Balla.Api.Services.Products;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Balla.Api.Controllers;

[Route("api/checkout")]
public class CheckoutController(
    IUserProfileRepository userProfileRepository,
    IProductRepository productRepository,
    IOrderRepository orderRepository,
    IStripeCheckoutService stripeCheckoutService,
    INotificationDispatcher notificationDispatcher,
    IOptions<StripeOptions> stripeOptions)
    : BallaControllerBase(userProfileRepository)
{
    [HttpPost("session")]
    [Authorize]
    public async Task<ActionResult<CheckoutSessionResponse>> CreateSession(CheckoutRequest request, CancellationToken ct)
    {
        var buyer = await GetCurrentProfileAsync(ct);
        if (buyer is null)
        {
            return NotFound();
        }

        // Group requested items by seller: a Stripe Checkout Session is one payment, but
        // each seller still needs their own Order record to manage/fulfill independently.
        // Shipping weight is accumulated per seller too, since each seller's items ship as
        // their own package (see ShippingPricing).
        var itemsBySeller = new Dictionary<string, (string SellerName, List<OrderItem> Items, decimal TotalWeightLbs)>();
        foreach (var requested in request.Items)
        {
            var product = await productRepository.GetAsync(requested.ProductId, ct);
            if (product is null)
            {
                return BadRequest(new { error = "PRODUCT_NOT_FOUND", message = "A product in your cart is no longer available." });
            }
            if (!PriceParser.TryParseToCents(product.Price, out var baseCents))
            {
                return BadRequest(new { error = "INVALID_PRICE", message = $"\"{product.Title}\" can't be purchased right now." });
            }
            var unitCents = CommissionPricing.ApplyToCents(baseCents);

            (string SellerName, List<OrderItem> Items, decimal TotalWeightLbs) group = itemsBySeller.TryGetValue(product.OwnerId, out var existing)
                ? existing
                : (product.OwnerName, new List<OrderItem>(), 0m);
            group.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductTitle = product.Title,
                ProductImage = product.Image,
                UnitPriceCents = unitCents,
                Quantity = requested.Quantity,
                SelectedOptions = requested.SelectedOptions,
            });
            itemsBySeller[product.OwnerId] = (group.SellerName, group.Items, group.TotalWeightLbs + product.WeightLbs * requested.Quantity);
        }

        if (itemsBySeller.Count == 0)
        {
            return BadRequest(new { error = "EMPTY_CART", message = "Your cart is empty." });
        }

        var now = DateTime.UtcNow.ToString("O");
        var orders = itemsBySeller.Select(kvp =>
        {
            var itemsSubtotalCents = kvp.Value.Items.Sum(i => i.UnitPriceCents * i.Quantity);
            var shippingCents = ShippingPricing.CalculateCents(kvp.Value.TotalWeightLbs);
            return new Order
            {
                OrderId = $"ORDER-{Guid.NewGuid():N}",
                BuyerId = buyer.UserId,
                BuyerName = buyer.Name,
                SellerId = kvp.Key,
                SellerName = kvp.Value.SellerName,
                Items = kvp.Value.Items,
                ShippingCents = shippingCents,
                TotalCents = itemsSubtotalCents + shippingCents,
                Currency = "usd",
                Status = OrderStatus.PendingPayment,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }).ToList();

        foreach (var order in orders)
        {
            await orderRepository.PutAsync(order, ct);
        }

        var session = await stripeCheckoutService.CreateCheckoutSessionAsync(orders, buyer.Email, ct);

        foreach (var order in orders)
        {
            order.StripeCheckoutSessionId = session.Id;
            await orderRepository.PutAsync(order, ct);
        }

        return Ok(new CheckoutSessionResponse(session.Url));
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync(ct);

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], stripeOptions.Value.WebhookSecret);
        }
        catch (StripeException)
        {
            return BadRequest();
        }

        if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted
            && stripeEvent.Data.Object is Session session
            && session.Metadata.TryGetValue("orderIds", out var orderIdsCsv))
        {
            foreach (var orderId in orderIdsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var order = await orderRepository.GetAsync(orderId, ct);
                if (order is null || order.Status != OrderStatus.PendingPayment)
                {
                    continue;
                }

                order.Status = OrderStatus.Paid;
                order.StripePaymentIntentId = session.PaymentIntentId;
                order.UpdatedAt = DateTime.UtcNow.ToString("O");
                await orderRepository.PutAsync(order, ct);

                await notificationDispatcher.DispatchAsync(
                    order.SellerId,
                    NotificationType.Order,
                    $"New order from {order.BuyerName} — ${order.TotalCents / 100.0:0.00}",
                    conversationId: null,
                    productId: null,
                    productTitle: null,
                    ct);
            }
        }

        return Ok();
    }
}
