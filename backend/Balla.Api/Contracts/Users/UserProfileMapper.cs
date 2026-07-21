using Balla.Api.Models;

namespace Balla.Api.Contracts.Users;

public static class UserProfileMapper
{
    public static UserProfileResponse ToResponse(this UserProfile profile) =>
        new(profile.UserId, profile.Name, profile.Email, profile.Role, profile.Status, profile.JoinedDate, profile.ZipCode, profile.State, profile.ProfileImageUrl, profile.OwnerId);
}
