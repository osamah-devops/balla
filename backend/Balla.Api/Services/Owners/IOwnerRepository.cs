using Balla.Api.Models;

namespace Balla.Api.Services.Owners;

public interface IOwnerRepository
{
    Task<IReadOnlyList<Owner>> ListAsync(CancellationToken ct);
    Task<Owner?> GetAsync(string id, CancellationToken ct);
    Task PutAsync(Owner owner, CancellationToken ct);
}
