using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Moderation;

public class RekognitionContentModerationService(IAmazonRekognition rekognitionClient, IOptions<ModerationOptions> options)
    : IContentModerationService
{
    public async Task<ModerationResult> CheckImageAsync(byte[] imageBytes, CancellationToken ct)
    {
        using var stream = new MemoryStream(imageBytes);
        var request = new DetectModerationLabelsRequest
        {
            Image = new Image { Bytes = stream },
            MinConfidence = options.Value.MinConfidence,
        };

        var response = await rekognitionClient.DetectModerationLabelsAsync(request, ct);

        // Rekognition already filters to labels at/above MinConfidence, so any label
        // returned here is a hit (nudity, violence, drugs, weapons, hate symbols, etc.).
        var reasons = response.ModerationLabels.Select(l => l.Name).Distinct().ToList();
        return new ModerationResult(reasons.Count > 0, reasons);
    }
}
