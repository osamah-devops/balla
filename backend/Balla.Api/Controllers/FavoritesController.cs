using Balla.Api.Contracts.Products;
using Balla.Api.Services.Favorites;
using Balla.Api.Services.Products;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[Authorize]
[Route("api/favorites")]
public class FavoritesController(
    IUserProfileRepository userProfileRepository,
    IFavoriteRepository favoriteRepository,
    IProductRepository productRepository)
    : BallaControllerBase(userProfileRepository)
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> List(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Ok(Array.Empty<ProductResponse>());
        }

        var favorites = await favoriteRepository.ListForUserAsync(userId, ct);
        var products = new List<ProductResponse>();
        foreach (var favorite in favorites)
        {
            var product = await productRepository.GetAsync(favorite.ProductId, ct);
            if (product is not null)
            {
                products.Add(product.ToResponse());
            }
        }
        return Ok(products);
    }

    [HttpGet("ids")]
    public async Task<ActionResult<IReadOnlyList<string>>> ListIds(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Ok(Array.Empty<string>());
        }

        var favorites = await favoriteRepository.ListForUserAsync(userId, ct);
        return Ok(favorites.Select(f => f.ProductId));
    }

    [HttpPost("{productId}")]
    public async Task<IActionResult> Add(string productId, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return NotFound();
        }

        var product = await productRepository.GetAsync(productId, ct);
        if (product is null)
        {
            return NotFound();
        }

        await favoriteRepository.AddAsync(userId, productId, ct);
        return NoContent();
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> Remove(string productId, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
        {
            return NotFound();
        }

        await favoriteRepository.RemoveAsync(userId, productId, ct);
        return NoContent();
    }
}
