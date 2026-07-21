using System.Globalization;

namespace Balla.Api.Services.Payments;

/// <summary>Product.Price is a free-text display string (e.g. "$199.99"); this is the one
/// place that needs an actual number out of it, to build Stripe line items in cents.</summary>
public static class PriceParser
{
    public static bool TryParseToCents(string price, out long cents)
    {
        var cleaned = price.Trim().TrimStart('$').Replace(",", "");
        if (decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var value) && value >= 0)
        {
            cents = (long)Math.Round(value * 100, MidpointRounding.AwayFromZero);
            return true;
        }
        cents = 0;
        return false;
    }
}
