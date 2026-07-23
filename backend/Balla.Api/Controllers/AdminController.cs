using Balla.Api.Contracts.Admin;
using Balla.Api.Contracts.Orders;
using Balla.Api.Contracts.Owners;
using Balla.Api.Contracts.Products;
using Balla.Api.Contracts.Users;
using Balla.Api.Services.Moderation;
using Balla.Api.Services.Orders;
using Balla.Api.Services.Owners;
using Balla.Api.Services.Products;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Authorize]
[Route("api/admin")]
public class AdminController(
    IUserProfileRepository userProfileRepository,
    IProductRepository productRepository,
    IOwnerRepository ownerRepository,
    IOrderRepository orderRepository,
    IReportRepository reportRepository)
    : BallaControllerBase(userProfileRepository)
{
    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserProfileResponse>>> ListUsers(CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var users = await userProfileRepository.ListAllAsync(ct);
        return Ok(users.Select(u => u.ToResponse()));
    }

    [HttpPatch("users/{userId}/status")]
    public async Task<ActionResult<UserProfileResponse>> UpdateUserStatus(string userId, UpdateUserStatusRequest request, CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var user = await userProfileRepository.GetAsync(userId, ct);
        if (user is null)
        {
            return NotFound();
        }

        user.Status = request.Status;
        await userProfileRepository.PutAsync(user, ct);
        return Ok(user.ToResponse());
    }

    [HttpGet("products")]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> ListProducts(CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var products = await productRepository.ListAsync(ct);
        return Ok(products.Select(p => p.ToResponse()));
    }

    [HttpPatch("products/{productId}/visibility")]
    public async Task<ActionResult<ProductResponse>> UpdateProductVisibility(string productId, UpdateProductVisibilityRequest request, CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var product = await productRepository.GetAsync(productId, ct);
        if (product is null)
        {
            return NotFound();
        }

        product.Hidden = request.Hidden;
        await productRepository.PutAsync(product, ct);
        return Ok(product.ToResponse());
    }

    [HttpPatch("owners/{ownerId}/verification")]
    public async Task<ActionResult<OwnerResponse>> UpdateOwnerVerification(string ownerId, UpdateOwnerVerificationRequest request, CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var owner = await ownerRepository.GetAsync(ownerId, ct);
        if (owner is null)
        {
            return NotFound();
        }

        owner.Verified = request.Verified;
        await ownerRepository.PutAsync(owner, ct);
        return Ok(owner.ToResponse());
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> ListOrders(CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var orders = await orderRepository.ListAllAsync(ct);
        return Ok(orders.Select(o => o.ToResponse()));
    }

    [HttpGet("reports")]
    public async Task<ActionResult<IReadOnlyList<ReportResponse>>> ListReports(CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var reports = await reportRepository.ListAllAsync(ct);
        return Ok(reports.OrderByDescending(r => r.CreatedAt).Select(r => r.ToResponse()));
    }

    [HttpPatch("reports/{reportId}/status")]
    public async Task<ActionResult<ReportResponse>> UpdateReportStatus(string reportId, UpdateReportStatusRequest request, CancellationToken ct)
    {
        if (!await IsAdminAsync(ct))
        {
            return Forbid();
        }

        var report = await reportRepository.GetAsync(reportId, ct);
        if (report is null)
        {
            return NotFound();
        }

        report.Status = request.Status;
        await reportRepository.PutAsync(report, ct);
        return Ok(report.ToResponse());
    }

    private async Task<bool> IsAdminAsync(CancellationToken ct)
    {
        var profile = await GetCurrentProfileAsync(ct);
        return profile is { Role: "admin" };
    }
}
