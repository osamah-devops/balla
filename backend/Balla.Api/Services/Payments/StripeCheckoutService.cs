using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;
using Stripe.Checkout;

namespace Balla.Api.Services.Payments;

public class StripeCheckoutService(IOptions<StripeOptions> options) : IStripeCheckoutService
{
    public async Task<Session> CreateCheckoutSessionAsync(IReadOnlyList<Order> orders, string buyerEmail, CancellationToken ct)
    {
        var lineItems = orders
            .SelectMany(order => order.Items
                .Select(item => new SessionLineItemOptions
                {
                    Quantity = item.Quantity,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = item.UnitPriceCents,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = item.ProductTitle,
                            Images = [item.ProductImage],
                        },
                    },
                })
                .Append(new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = order.ShippingCents,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Shipping — {order.SellerName}",
                        },
                    },
                }))
            .ToList();

        var sessionOptions = new SessionCreateOptions
        {
            Mode = "payment",
            LineItems = lineItems,
            CustomerEmail = buyerEmail,
            SuccessUrl = options.Value.SuccessUrl,
            CancelUrl = options.Value.CancelUrl,
            Metadata = new Dictionary<string, string>
            {
                ["orderIds"] = string.Join(",", orders.Select(o => o.OrderId)),
            },
        };

        var service = new SessionService();
        return await service.CreateAsync(sessionOptions, cancellationToken: ct);
    }
}
