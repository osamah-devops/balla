using Amazon.S3;
using Amazon.S3.Model;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Storage;

public class S3FileStorage(IAmazonS3 s3Client, IOptions<AwsResourceOptions> options) : IFileStorage
{
    private readonly AwsResourceOptions _options = options.Value;

    public async Task<string> UploadAsync(string keyPrefix, Stream content, string contentType, string fileExtension, CancellationToken ct)
    {
        var key = $"uploads/{keyPrefix}/{Guid.NewGuid()}{fileExtension}";

        var request = new PutObjectRequest
        {
            BucketName = _options.UploadsBucketName,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            DisablePayloadSigning = true,
        };

        await s3Client.PutObjectAsync(request, ct);

        return $"{_options.PublicAssetsBaseUrl.TrimEnd('/')}/{key}";
    }
}
