namespace Balla.Api.Options;

public class StripeOptions
{
    public const string SectionName = "Stripe";

    public required string SecretKey { get; set; }
    public required string WebhookSecret { get; set; }

    /// <summary>Frontend routes Stripe redirects back to; {CHECKOUT_SESSION_ID} is a literal
    /// placeholder Stripe substitutes itself, not C# interpolation.</summary>
    public required string SuccessUrl { get; set; }
    public required string CancelUrl { get; set; }
}
