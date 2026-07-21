using System.Text.Json.Serialization;
using Amazon.CognitoIdentityProvider;
using Amazon.DynamoDBv2;
using Amazon.Rekognition;
using Amazon.S3;
using Amazon.SimpleEmail;
using Balla.Api.Hubs;
using Balla.Api.Middleware;
using Balla.Api.Options;
using Balla.Api.Services.Auth;
using Balla.Api.Services.Comments;
using Balla.Api.Services.Messaging;
using Balla.Api.Services.Moderation;
using Balla.Api.Services.Notifications;
using Balla.Api.Services.Offers;
using Balla.Api.Services.Owners;
using Balla.Api.Services.Products;
using Balla.Api.Services.Ratings;
using Balla.Api.Services.Storage;
using Balla.Api.Services.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<CognitoOptions>(builder.Configuration.GetSection(CognitoOptions.SectionName));
builder.Services.Configure<AwsResourceOptions>(builder.Configuration.GetSection(AwsResourceOptions.SectionName));
builder.Services.Configure<SesOptions>(builder.Configuration.GetSection(SesOptions.SectionName));
builder.Services.Configure<ModerationOptions>(builder.Configuration.GetSection(ModerationOptions.SectionName));

builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonCognitoIdentityProvider>();
builder.Services.AddAWSService<IAmazonDynamoDB>();
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddAWSService<IAmazonSimpleEmailService>();
builder.Services.AddAWSService<IAmazonRekognition>();

builder.Services.AddScoped<ICognitoAuthService, CognitoAuthService>();
builder.Services.AddScoped<IUserProfileRepository, DynamoDbUserProfileRepository>();
builder.Services.AddScoped<IFileStorage, S3FileStorage>();
builder.Services.AddScoped<IProductRepository, DynamoDbProductRepository>();
builder.Services.AddScoped<IOwnerRepository, DynamoDbOwnerRepository>();
builder.Services.AddScoped<ICommentRepository, DynamoDbCommentRepository>();
builder.Services.AddScoped<IRatingRepository, DynamoDbRatingRepository>();
builder.Services.AddScoped<IConversationRepository, DynamoDbConversationRepository>();
builder.Services.AddScoped<IConversationMessageRepository, DynamoDbConversationMessageRepository>();
builder.Services.AddScoped<IConversationMessenger, ConversationMessenger>();
builder.Services.AddScoped<IOfferRepository, DynamoDbOfferRepository>();
builder.Services.AddScoped<INotificationRepository, DynamoDbNotificationRepository>();
builder.Services.AddScoped<ISesEmailSender, SesEmailSender>();
builder.Services.AddScoped<IContentModerationService, RekognitionContentModerationService>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
builder.Services.AddSingleton<IOnlinePresenceTracker, OnlinePresenceTracker>();
builder.Services.AddSingleton<INotificationPublisher, SignalRNotificationPublisher>();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

var cognitoOptions = builder.Configuration.GetSection(CognitoOptions.SectionName).Get<CognitoOptions>()
    ?? throw new InvalidOperationException("Cognito configuration is missing.");
var issuer = cognitoOptions.Issuer;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = issuer;
        // Keep original Cognito claim names ("sub", "token_use", "client_id") instead of
        // the legacy XML/SOAP remapping ASP.NET Core applies by default.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = false,
            ValidateLifetime = true,
        };
        options.Events = new JwtBearerEvents
        {
            // Cognito access tokens carry client_id (not aud), so the client is checked here instead.
            OnTokenValidated = context =>
            {
                var tokenUse = context.Principal?.FindFirst("token_use")?.Value;
                var clientId = context.Principal?.FindFirst("client_id")?.Value;
                if (tokenUse != "access" || clientId != cognitoOptions.ClientId)
                {
                    context.Fail("Token is not a valid access token for this client.");
                }
                return Task.CompletedTask;
            },
            // Browsers can't set an Authorization header on a WebSocket handshake, so the
            // SignalR client sends the token as a query param for this hub path instead.
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/api/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
        };
    });
builder.Services.AddAuthorization();

var corsOrigin = builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:4200";
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(corsOrigin).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.MapControllers();
app.MapHub<NotificationsHub>("/api/hubs/notifications");

app.Run();
