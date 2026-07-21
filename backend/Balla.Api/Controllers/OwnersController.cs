using Balla.Api.Contracts.Owners;
using Balla.Api.Services.Owners;
using Microsoft.AspNetCore.Mvc;

namespace Balla.Api.Controllers;

[ApiController]
[Route("api/owners")]
public class OwnersController(IOwnerRepository ownerRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OwnerResponse>>> List(CancellationToken ct)
    {
        var owners = await ownerRepository.ListAsync(ct);
        return Ok(owners.Select(o => o.ToResponse()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OwnerResponse>> Get(string id, CancellationToken ct)
    {
        var owner = await ownerRepository.GetAsync(id, ct);
        return owner is null ? NotFound() : Ok(owner.ToResponse());
    }
}
