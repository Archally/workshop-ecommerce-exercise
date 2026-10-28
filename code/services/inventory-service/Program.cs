using InventoryService.Services;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<IInventoryService, InventoryServiceImplementation>();

builder.Services.AddHealthChecks();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Inventory Service API",
        Version = "v1",
Description = "Reserve and check stock",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Inventory Service Team",
            Email = "support@example.com"
        }
    });

    // The /// docs on the controllers and models ARE this service's public API
    // descriptions: the build compiles them into <assembly>.xml and Swagger
    // serves them. Deleting one deletes a line a consumer reads.
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory Service API v1");
        options.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseHttpsRedirection();
app.UseCors();

app.MapControllers();

app.MapHealthChecks("/health");

app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Processing request: {Method} {Path}",
        context.Request.Method,
        context.Request.Path);

    await next();

    logger.LogInformation("Completed request: {Method} {Path} - Status: {StatusCode}",
        context.Request.Method,
        context.Request.Path,
        context.Response.StatusCode);
});

Console.WriteLine("Inventory Service starting...");
Console.WriteLine("Swagger UI available at: https://localhost:7004 (HTTPS) or http://localhost:3004 (HTTP)");
Console.WriteLine("Health check available at: https://localhost:7004/health");
Console.WriteLine("Reserve stock: POST https://localhost:7004/inventory/reserve");
Console.WriteLine("Check stock:   GET  https://localhost:7004/inventory/{sku}/stock");

app.Run();

/// <summary>
/// Entry point exposed so a provider contract suite could host this service
/// in-process with WebApplicationFactory&lt;Program&gt;, the same pattern
/// customer-service uses. Top-level statements generate an internal Program
/// class; a public one is what that hosting model needs.
/// </summary>
public partial class Program { }
