using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Balla.Api.Contracts.Notifications;
using Balla.Api.Options;
using Balla.Api.Services.Users;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Notifications;

public class SesEmailSender(
    IAmazonSimpleEmailService sesClient,
    IUserProfileRepository userProfileRepository,
    IOptions<SesOptions> sesOptions) : ISesEmailSender
{
    public async Task SendNotificationEmailAsync(string recipientId, NotificationPayload payload, CancellationToken ct)
    {
        // recipientId is always the Cognito sub/UserId, for both buyers and sellers
        // (a seller's Owner.Id is set to their own UserId at registration), so the same
        // profile lookup resolves an email address regardless of which side sent it.
        var profile = await userProfileRepository.GetAsync(recipientId, ct);
        if (profile is null || string.IsNullOrEmpty(profile.Email))
        {
            return;
        }

        var request = new SendEmailRequest
        {
            Source = sesOptions.Value.FromAddress,
            Destination = new Destination { ToAddresses = [profile.Email] },
            Message = new Message
            {
                Subject = new Content("New activity on Marmil"),
                Body = new Body { Text = new Content(payload.Message) },
            },
        };

        await sesClient.SendEmailAsync(request, ct);
    }
}
