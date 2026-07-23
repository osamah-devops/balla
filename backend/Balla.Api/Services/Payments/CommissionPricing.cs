using System.Globalization;

namespace Balla.Api.Services.Payments;

/// <summary>The platform's cut on top of what a seller lists a product for. Applied once
/// here and consumed everywhere a price reaches a buyer (product responses, checkout), so
/// what's displayed always matches what Stripe actually charges.</summary>
public static class CommissionPricing
{
    public const decimal Rate = 1.15m;

    public static long ApplyToCents(long baseCents) =>
        (long)Math.Round(baseCents * Rate, MidpointRounding.AwayFromZero);

    /// <summary>Best-effort: falls back to the original string if it isn't a parseable price,
    /// since Product.Price has no validation at listing time.</summary>
    public static string ApplyToDisplayPrice(string price)
    {
        if (!PriceParser.TryParseToCents(price, out var baseCents))
        {
            return price;
        }
        var cents = ApplyToCents(baseCents);
        return string.Create(CultureInfo.InvariantCulture, $"${cents / 100m:F2}");
    }
}