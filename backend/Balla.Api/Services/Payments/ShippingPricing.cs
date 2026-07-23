namespace Balla.Api.Services.Payments;

/// <summary>Flat-rate shipping, tiered by total order weight — the way carriers price flat-rate
/// boxes (a weight bracket buys a fixed rate) rather than a live per-shipment carrier quote.
/// Priced per seller: each seller's items in a cart ship as their own package.</summary>
public static class ShippingPricing
{
    private static readonly (decimal MaxWeightLbs, long Cents)[] Tiers =
    [
        (1m, 599),
        (5m, 899),
        (15m, 1499),
        (40m, 2499),
        (decimal.MaxValue, 3999),
    ];

    public static long CalculateCents(decimal totalWeightLbs)
    {
        foreach (var (maxWeightLbs, cents) in Tiers)
        {
            if (totalWeightLbs <= maxWeightLbs)
            {
                return cents;
            }
        }
        return Tiers[^1].Cents;
    }
}
