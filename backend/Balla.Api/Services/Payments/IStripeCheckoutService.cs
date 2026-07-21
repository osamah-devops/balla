using Balla.Api.Models;
using Stripe.Checkout;

namespace Balla.Api.Services.Payments;

public interface IStripeCheckoutService
{
    /// <summary>One Checkout Session covering every order (which may span multiple sellers);
    /// the session id is what ties the webhook confirmation back to these orders.</summary>
    Task<Session> CreateCheckoutSessionAsync(IReadOnlyList<Order> orders, string buyerEmail, CancellationToken ct);
}
