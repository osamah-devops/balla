namespace Balla.Api.Contracts.Owners;

public record OwnerResponse(string Id, string Name, string Location, string State, string Zip, double Rating, int Reviews, int MemberSince, bool Verified);
