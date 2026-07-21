using Balla.Api.Contracts.Notifications;
using Balla.Api.Contracts.Offers;
using Balla.Api.Models;
using Balla.Api.Services.Messaging;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Offers;
using Balla.Api.Services.Products;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Authorize]
public class OffersController(
    IUserProfileRepository userProfileRepository,
    IOfferRepository offerRepository,
    IProductRepository productRepository,
    IConversationRepository conversationRepository,
    IConversationMessenger conversationMessenger,
    INotificationDispatcher notificationDispatcher)
    : BallaControllerBase(userProfileRepository)
{
    [HttpPost("api/sellers/{sellerId}/offers")]
    public async Task<ActionResult<OfferResponse>> Send(string sellerId, CreateOfferRequest request, CancellationToken ct)
    {
        var buyer = await GetCurrentProfileAsync(ct);
        if (buyer is null)
        {
            return NotFound();
        }

        var product = await productRepository.GetAsync(request.ProductId, ct);
        if (product is null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = "That product no longer exists." });
        }

        var offer = new Offer
        {
            SellerId = sellerId,
            OfferId = $"{DateTime.UtcNow:O}#{Guid.NewGuid():N}",
            ProductId = product.Id,
            ProductTitle = product.Title,
            BuyerId = buyer.UserId,
            BuyerName = buyer.Name,
            Amount = request.Amount,
            Note = request.Note,
            Status = OfferStatus.Pending,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        };
        await offerRepository.PutAsync(offer, ct);

        await notificationDispatcher.DispatchAsync(
            sellerId,
            NotificationType.Offer,
            $"{buyer.Name} offered ${request.Amount:0.##} for \"{product.Title}\"",
            conversationId: null,
            product.Id,
            product.Title,
            ct);

        return Ok(offer.ToResponse());
    }

    [HttpGet("api/offers/inbox")]
    public async Task<ActionResult<IReadOnlyList<OfferResponse>>> Inbox(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null || string.IsNullOrEmpty(profile.OwnerId))
        {
            return Ok(Array.Empty<OfferResponse>());
        }

        var offers = await offerRepository.ListBySellerAsync(profile.OwnerId, ct);
        return Ok(offers.Select(o => o.ToResponse()));
    }

    [HttpPatch("api/offers/{offerId}")]
    public async Task<ActionResult<OfferResponse>> UpdateStatus(string offerId, UpdateOfferStatusRequest request, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null || string.IsNullOrEmpty(profile.OwnerId))
        {
            return NotFound();
        }

        var offer = await offerRepository.GetAsync(profile.OwnerId, offerId, ct);
        if (offer is null)
        {
            return NotFound();
        }
        if (offer.Status != OfferStatus.Pending)
        {
            return Conflict(new { error = "OFFER_ALREADY_DECIDED", message = $"This offer was already {offer.Status}." });
        }

        offer.Status = request.Status;
        await offerRepository.PutAsync(offer, ct);

        var accepted = request.Status == OfferStatus.Accepted;
        var body = accepted
            ? $"Great news — I've accepted your offer of ${offer.Amount:0.##} for \"{offer.ProductTitle}\". Let's coordinate next steps here."
            : $"Thanks for the offer, but I can't accept ${offer.Amount:0.##} for \"{offer.ProductTitle}\" right now.";
        var notificationText = accepted
            ? $"{profile.Name} accepted your offer for \"{offer.ProductTitle}\""
            : $"{profile.Name} declined your offer for \"{offer.ProductTitle}\"";

        var buyerProfile = await userProfileRepository.GetAsync(offer.BuyerId, ct);
        var conversation = await conversationRepository.FindOrCreateAsync(
            offer.BuyerId, offer.BuyerName, buyerProfile?.ProfileImageUrl,
            profile.OwnerId, profile.Name, profile.ProfileImageUrl,
            ct);
        await conversationMessenger.SendAsync(
            conversation, profile.UserId, profile.Name, body, offer.ProductId, offer.ProductTitle,
            NotificationType.Offer, notificationText, ct);

        return Ok(offer.ToResponse());
    }
}
