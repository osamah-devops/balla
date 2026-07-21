namespace Balla.Api.Services.Moderation;

public record ModerationResult(bool IsFlagged, IReadOnlyList<string> Reasons);

public interface IContentModerationService
{
    Task<ModerationResult> CheckImageAsync(byte[] imageBytes, CancellationToken ct);
}
