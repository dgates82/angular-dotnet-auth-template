using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using AngularDotNetAuthTemplate.Api.Data;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.Options;
using AngularDotNetAuthTemplate.Api.Services;
using System.Reflection;
using System.Text;

namespace AngularDotNetAuthTemplate.Api
{
    public class Program
    {
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
                    .GetBytes(jwtSettings.GetSection("securityKey").Value))
                };
            });
            builder.Services.AddControllersWithViews().AddNewtonsoftJson(options => 
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore);


            // Default sender: SMTP pointed at the Mailpit container from docker-compose.yml,
            // so a fresh clone has a working email path with no external account/API key.
            // Swap to SendGrid/PostMark below (and supply your own key via
            // appsettings.Development.json or user-secrets) for a real provider.
            builder.Services.Configure<SmtpEmailOptions>(builder.Configuration.GetSection(SmtpEmailOptions.ConfigSection));
            builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

            // builder.Services.Configure<SendGridEmailOptions>(builder.Configuration.GetSection(SendGridEmailOptions.ConfigSection));
            // builder.Services.AddTransient<IEmailSender, SendGridEmailSender>();

            // builder.Services.Configure<PostMarkEmailOptions>(builder.Configuration.GetSection(PostMarkEmailOptions.ConfigSection));
            // builder.Services.AddTransient<IEmailSender, PostMarkEmailSender>();
            
            builder.Services.Configure<TwilioSmsOptions>(builder.Configuration.GetSection(TwilioSmsOptions.ConfigSection));
            builder.Services.AddTransient<ISmsSender, TwilioSmsSender>();
            
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

            // SPA fallback: any GET request that doesn't match a controller or
            // Razor route falls through to the Angular app's index.html, so
            // client-side routes (e.g. a hard refresh on /profile) load the SPA
            // shell instead of a raw 404. Real /api/* 404s are preserved.
            //
            // Uses an explicit "{**path}" pattern rather than the parameterless
            // MapFallback(handler) overload: that overload applies an implicit
            // ":nonfile" constraint that excludes any path whose last segment
            // contains a dot (to avoid swallowing missing-static-file 404s), but
            // this app has real client routes with a dotted last segment (e.g.
            // /enable2fa/:email), which that constraint would incorrectly 404.
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