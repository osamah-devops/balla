using Balla.Api.Contracts.Messaging;
using Balla.Api.Contracts.Notifications;
using Balla.Api.Models;
using Balla.Api.Services.Messaging;
using Balla.Api.Services.Moderation;
using Balla.Api.Services.Products;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Balla.Api.Controllers;

[Authorize]
public class ConversationsController(
    IUserProfileRepository userProfileRepository,
    IConversationRepository conversationRepository,
    IConversationMessageRepository conversationMessageRepository,
    IProductRepository productRepository,
    IConversationMessenger conversationMessenger,
    IReportRepository reportRepository)
    : BallaControllerBase(userProfileRepository)
{
    [HttpPost("api/sellers/{sellerId}/conversations")]
    [EnableRateLimiting("messaging")]
    public async Task<ActionResult<ConversationSummaryResponse>> Start(string sellerId, StartConversationRequest request, CancellationToken ct)
    {
        var buyer = await GetCurrentProfileAsync(ct);
        if (buyer is null)
        {
            return NotFound();
        }

        var sellerProfile = await userProfileRepository.GetAsync(sellerId, ct);
        if (sellerProfile is null)
        {
            return NotFound();
        }
        if (IsBlocked(buyer, sellerId, sellerProfile))
        {
            return StatusCode(403, new { error = "BLOCKED", message = "You can't message this seller." });
        }

        string? productTitle = null;
        if (!string.IsNullOrEmpty(request.ProductId))
        {
            var product = await productRepository.GetAsync(request.ProductId, ct);
            productTitle = product?.Title;
        }

        var conversation = await conversationRepository.FindOrCreateAsync(
            buyer.UserId, buyer.Name, buyer.ProfileImageUrl,
            sellerId, sellerProfile.Name, sellerProfile.ProfileImageUrl,
            ct);
        await conversationMessenger.SendAsync(
            conversation, buyer.UserId, buyer.Name, request.Body, request.ProductId, productTitle,
            NotificationType.Message, $"{buyer.Name} sent you a message", ct);

        return Ok(conversation.ToResponse(buyer.UserId));
    }

    [HttpGet("api/conversations")]
    public async Task<ActionResult<IReadOnlyList<ConversationSummaryResponse>>> List(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return Ok(Array.Empty<ConversationSummaryResponse>());
        }

        var asBuyer = await conversationRepository.ListForBuyerAsync(profile.UserId, ct);
        var asSeller = string.IsNullOrEmpty(profile.OwnerId)
            ? []
            : await conversationRepository.ListForSellerAsync(profile.OwnerId, ct);

        var conversations = asBuyer.Concat(asSeller)
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => c.ToResponse(profile.UserId));

        return Ok(conversations);
    }

    [HttpGet("api/conversations/{conversationId}/messages")]
    public async Task<ActionResult<IReadOnlyList<ConversationMessageResponse>>> Messages(string conversationId, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var conversation = await conversationRepository.GetAsync(conversationId, ct);
        if (conversation is null || !IsParticipant(conversation, profile))
        {
            return NotFound();
        }

        MarkRead(conversation, profile);
        await conversationRepository.PutAsync(conversation, ct);

        var messages = await conversationMessageRepository.ListAsync(conversationId, ct);
        return Ok(messages.Select(m => m.ToResponse()));
    }

    [HttpPost("api/conversations/{conversationId}/messages")]
    [EnableRateLimiting("messaging")]
    public async Task<ActionResult<ConversationMessageResponse>> Reply(string conversationId, SendReplyRequest request, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var conversation = await conversationRepository.GetAsync(conversationId, ct);
        if (conversation is null || !IsParticipant(conversation, profile))
        {
            return NotFound();
        }

        var otherPartyId = profile.UserId == conversation.SellerId ? conversation.BuyerId : conversation.SellerId;
        var otherProfile = await userProfileRepository.GetAsync(otherPartyId, ct);
        if (IsBlocked(profile, otherPartyId, otherProfile))
        {
            return StatusCode(403, new { error = "BLOCKED", message = "You can't send messages in this conversation." });
        }

        var message = await conversationMessenger.SendAsync(
            conversation, profile.UserId, profile.Name, request.Body, conversation.LastProductId, conversation.LastProductTitle,
            NotificationType.Message, $"{profile.Name} sent you a message", ct);

        return Ok(message.ToResponse());
    }

    [HttpPost("api/conversations/{conversationId}/report")]
    public async Task<IActionResult> Report(string conversationId, ReportConversationRequest request, CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        if (profile is null)
        {
            return NotFound();
        }

        var conversation = await conversationRepository.GetAsync(conversationId, ct);
        if (conversation is null || !IsParticipant(conversation, profile))
        {
            return NotFound();
        }

        var reportedUserId = profile.UserId == conversation.SellerId ? conversation.BuyerId : conversation.SellerId;
        await reportRepository.PutAsync(new Report
        {
            ReportId = $"{DateTime.UtcNow:O}#{Guid.NewGuid():N}",
            ConversationId = conversationId,
            ReporterId = profile.UserId,
            ReporterName = profile.Name,
            ReportedUserId = reportedUserId,
            Reason = request.Reason,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        }, ct);

        return NoContent();
    }

    private static bool IsBlocked(UserProfile viewer, string otherPartyId, UserProfile? otherProfile) =>
        otherProfile?.BlockedUserIds?.Contains(viewer.UserId) == true || viewer.BlockedUserIds?.Contains(otherPartyId) == true;

    private static bool IsParticipant(Conversation conversation, UserProfile profile) =>
        profile.UserId == conversation.BuyerId || profile.UserId == conversation.SellerId;

    private static void MarkRead(Conversation conversation, UserProfile profile)
    {
        if (profile.UserId == conversation.SellerId)
        {
            conversation.SellerUnreadCount = 0;
        }
        else
        {
            conversation.BuyerUnreadCount = 0;
        }
    }
}
