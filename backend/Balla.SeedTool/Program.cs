// One-time import of frontend/public/data/{products,owners}.json into the DynamoDB tables
// Terraform creates. Run once after `terraform apply`, before the API needs real catalog data:
//
//   PRODUCTS_TABLE=<terraform output dynamodb_products_table_name> \
//   OWNERS_TABLE=<terraform output dynamodb_owners_table_name> \
//   dotnet run
//
// Uses whatever AWS credentials are active in the shell (same as the Terraform apply).

using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;

var productsTable = Environment.GetEnvironmentVariable("PRODUCTS_TABLE");
var ownersTable = Environment.GetEnvironmentVariable("OWNERS_TABLE");
var dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? Path.Combine("..", "..", "frontend", "public", "data");

if (string.IsNullOrEmpty(productsTable) || string.IsNullOrEmpty(ownersTable))
{
    Console.Error.WriteLine("Set PRODUCTS_TABLE and OWNERS_TABLE env vars (see `terraform output` in infrastructure/) before running.");
    return 1;
}

var productsPath = Path.Combine(dataDir, "products.json");
var ownersPath = Path.Combine(dataDir, "owners.json");

if (!File.Exists(productsPath) || !File.Exists(ownersPath))
{
    Console.Error.WriteLine($"Could not find products.json/owners.json under '{Path.GetFullPath(dataDir)}'. Set DATA_DIR explicitly.");
    return 1;
}

var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

var rawOwners = JsonSerializer.Deserialize<List<RawOwner>>(File.ReadAllText(ownersPath), jsonOptions) ?? [];
var rawProducts = JsonSerializer.Deserialize<List<RawProduct>>(File.ReadAllText(productsPath), jsonOptions) ?? [];

using var client = new AmazonDynamoDBClient();
var context = new DynamoDBContext(client);

Console.WriteLine($"Seeding {rawOwners.Count} owners into '{ownersTable}'...");
var ownersConfig = new DynamoDBOperationConfig { OverrideTableName = ownersTable };
foreach (var owner in rawOwners)
{
    await context.SaveAsync(
        new SeedOwner
        {
            Id = owner.Id,
            Name = owner.Name,
            Location = owner.Location,
            State = owner.State ?? "",
            Zip = owner.Zip ?? "",
            Rating = owner.Rating,
            Reviews = owner.Reviews,
            MemberSince = owner.MemberSince,
            Verified = owner.Verified,
        },
        ownersConfig);
}

// products.json embeds only {id, name, location} per owner; zip/state live on the owner
// records, so join them in here rather than duplicating them across 160 product entries.
var ownersById = rawOwners.ToDictionary(o => o.Id);

Console.WriteLine($"Seeding {rawProducts.Count} products into '{productsTable}'...");
var productsConfig = new DynamoDBOperationConfig { OverrideTableName = productsTable };
foreach (var product in rawProducts)
{
    var productSeller = ownersById.GetValueOrDefault(product.Owner.Id);
    await context.SaveAsync(
        new SeedProduct
        {
            Id = product.Id,
            Category = product.Category,
            CategorySlug = product.CategorySlug,
            Title = product.Title,
            Price = product.Price,
            Currency = product.Currency,
            FullDescription = product.FullDescription,
            Specifications = product.Specifications,
            Image = product.Image,
            OwnerId = product.Owner.Id,
            OwnerName = product.Owner.Name,
            OwnerLocation = product.Owner.Location,
            OwnerState = productSeller?.State ?? "",
            OwnerZip = productSeller?.Zip ?? "",
            AverageRating = 0,
            RatingCount = 0,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        },
        productsConfig);
}

Console.WriteLine("Done.");
return 0;

record RawOwner(string Id, string Name, string Location, string? State, string? Zip, double Rating, int Reviews, int MemberSince, bool Verified);

record RawProductOwner(string Id, string Name, string Location);

record RawProduct(
    string Id,
    string Category,
    string Title,
    string Price,
    string Currency,
    [property: JsonPropertyName("full_description")] string FullDescription,
    Dictionary<string, string>? Specifications,
    RawProductOwner Owner,
    string CategorySlug,
    string Image
);

// Mirrors Balla.Api's Models/Owner.cs and Models/Product.cs field-for-field (kept as a
// standalone copy rather than a project reference, since this tool is a one-off script).
class SeedOwner
{
    [DynamoDBHashKey("Id")]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string Location { get; set; } = default!;
    public string State { get; set; } = "";
    public string Zip { get; set; } = "";
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public int MemberSince { get; set; }
    public bool Verified { get; set; }
}

class SeedProduct
{
    [DynamoDBHashKey("Id")]
    public string Id { get; set; } = default!;

    public string Category { get; set; } = default!;
    public string CategorySlug { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Price { get; set; } = default!;
    public string Currency { get; set; } = default!;
    public string FullDescription { get; set; } = default!;
    public Dictionary<string, string>? Specifications { get; set; }
    public string Image { get; set; } = default!;
    public string OwnerId { get; set; } = default!;
    public string OwnerName { get; set; } = default!;
    public string OwnerLocation { get; set; } = default!;
    public string OwnerState { get; set; } = "";
    public string OwnerZip { get; set; } = "";
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
    public string CreatedAt { get; set; } = default!;
}
