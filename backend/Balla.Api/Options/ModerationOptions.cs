namespace Balla.Api.Options;

public class ModerationOptions
{
    public const string SectionName = "Moderation";

    /// <summary>Rekognition confidence (0-100) above which a detected label blocks the upload.</summary>
    public float MinConfidence { get; set; } = 75f;
}
