using Balla.Api.Models;

namespace Balla.Api.Contracts.Owners;

public static class OwnerMapper
{
    public static OwnerResponse ToResponse(this Owner owner) =>
        new(owner.Id, owner.Name, owner.Location, owner.State, owner.Zip, owner.Rating, owner.Reviews, owner.MemberSince, owner.Verified);
}
