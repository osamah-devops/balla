namespace Balla.Api.Services.Auth;

public class AuthException(string errorCode, int statusCode, string message, Exception? inner = null)
    : Exception(message, inner)
{
    public string ErrorCode { get; } = errorCode;
    public int StatusCode { get; } = statusCode;
}
