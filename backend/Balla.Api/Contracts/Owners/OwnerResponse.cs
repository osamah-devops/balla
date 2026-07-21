namespace Balla.Api.Contracts.Owners;

public record OwnerResponse(string Id, string Name, string Location, double Rating, int Reviews, int MemberSince, bool Verified);
