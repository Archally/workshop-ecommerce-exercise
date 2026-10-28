using CustomerService.Services;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<ICustomerService, CustomerServiceImplementation>();
builder.Services.AddScoped<IOperatorService, OperatorServiceImplementation>();

// Singleton because a session outlives the request that issued it - a scoped
// store would hand every request an empty one.
builder.Services.AddSingleton<ISessionStore, SessionStore>();

builder.Services.AddHealthChecks();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Customer Service API",
        Version = "v1",
        Description = "A customer management service providing customer details, discount information, and shop operator records",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Customer Service Team",
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
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Customer Service API v1");
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

Console.WriteLine("🚀 Customer Service starting...");
Console.WriteLine("📖 Swagger UI available at: https://localhost:7003 (HTTPS) or http://localhost:3003 (HTTP)");
Console.WriteLine("🏥 Health check available at: https://localhost:7003/health");
Console.WriteLine("👥 Customers API available at: https://localhost:7003/customers");
Console.WriteLine("🛠️ Operators API available at: https://localhost:7003/operators");

app.Run();

/// <summary>
/// Entry point exposed so the provider contract suite can host this service
/// in-process with WebApplicationFactory&lt;Program&gt;. Top-level statements
/// generate an internal Program class; contract tests need it to be public.
/// </summary>
public partial class Program { }
