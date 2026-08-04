using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using AngularDotNetAuthTemplate.Api.Data;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.Options;
using AngularDotNetAuthTemplate.Api.Services;
using DGates.Identity.NotificationProviders.Providers.Email;
using DGates.Identity.NotificationProviders.Providers.Sms;
using System.Reflection;
using System.Text;

namespace AngularDotNetAuthTemplate.Api
{
    /// <summary>
    /// The application entry point. Declared public, rather than internal + InternalsVisibleTo, because
    /// the test project's <c>WebApplicationFactory&lt;Program&gt;</c>-based fixture and xUnit test classes
    /// referencing it must themselves be public (xUnit's analyzers enforce this) - a public class can't
    /// list an internal type in its base-type list even with InternalsVisibleTo, so Program has to be public too.
    /// </summary>
    public class Program
    {
        /// <summary>Configures and runs the web host.</summary>
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                Args = args,
                WebRootPath = "../../client/dist/browser"
            });

            Console.WriteLine($"WebRoot Path: {builder.Environment.WebRootPath}");

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                options.IncludeXmlComments(xmlPath);
            });

            // Add services to the container.
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            builder.Services.AddDatabaseDeveloperPageExceptionFilter();

            builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            builder.Services.AddScoped<ApplicationUserRepository, ApplicationUserRepository>();

            var jwtSettings = builder.Configuration.GetSection(JwtOptions.ConfigSection);

            // AddIdentity must come before AddAuthentication().AddJwtBearer()
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.SignIn.RequireConfirmedAccount = true;
            })
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            builder.Services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["validIssuer"],
                    ValidAudience = jwtSettings["validAudience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8
                    .GetBytes(jwtSettings.GetSection("securityKey").Value
                        ?? throw new InvalidOperationException($"'{JwtOptions.ConfigSection}:securityKey' not found.")))
                };
            });
            builder.Services.AddControllersWithViews().AddNewtonsoftJson(options => 
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore);

            // Default sender: SMTP pointed at the Mailpit container from docker-compose.yml,
            // so a fresh clone has a working email path with no external account/API key.
            // TODO(template): swap to SendGrid/PostMark below (and supply your own key via
            // appsettings.Development.json or user-secrets) for a real provider - see README's
            // "Customizing for Your Project" section.
            builder.Services.AddSmtpEmailSender(builder.Configuration);
            // builder.Services.AddSendGridEmailSender(builder.Configuration);
            // builder.Services.AddPostMarkEmailSender(builder.Configuration);

            // Default sender: Twilio, pointed at the twilio-mock container from
            // docker-compose.yml so a fresh clone has a working SMS path with no external account.
            // TODO(template): swap to SNS below (and supply your own credentials via
            // appsettings.Development.json or user-secrets) for a real provider - see README's
            // "Customizing for Your Project" section.
            builder.Services.AddTwilioSmsSender(builder.Configuration);
            // builder.Services.AddSnsSmsSender(builder.Configuration);
            
            builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.ConfigSection));
            builder.Services.AddScoped<JwtHandler>();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                DbSeeder.SeedAsync(scope.ServiceProvider, app.Configuration).GetAwaiter().GetResult();
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseMigrationsEndPoint();
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            
            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            app.MapControllers();

            // SPA fallback: explicit "{**path}" pattern, not MapFallback(handler) - that
            // overload's implicit :nonfile constraint breaks dotted routes like /enable2fa/:email.
            app.MapFallback("/{**path}", async context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return;
                }

                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath, "index.html"));
            });

            app.Run();
        }
    }
}