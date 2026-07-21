namespace Balla.Api.Services.Storage;

public interface IFileStorage
{
    /// <summary>Uploads the file under the given key prefix and returns the public URL it's reachable at.</summary>
    Task<string> UploadAsync(string keyPrefix, Stream content, string contentType, string fileExtension, CancellationToken ct);
}
