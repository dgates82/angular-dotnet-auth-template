using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using AngularAndDotNetCoreAuthTemplate.Data;
using AngularAndDotNetCoreAuthTemplate.Models;
using AngularAndDotNetCoreAuthTemplate.Models.Options;
using AngularAndDotNetCoreAuthTemplate.Services;
using System.Text;

namespace AngularAndDotNetCoreAuthTemplate
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                Args = args,
                WebRootPath = "ClientApp"
            });                     

            Console.WriteLine($"WebRoot Path: {builder.Environment.WebRootPath}");

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            

            // Add services to the container.
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            builder.Services.AddDatabaseDeveloperPageExceptionFilter();

            builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            builder.Services.AddScoped<ApplicationUserRepository, ApplicationUserRepository>();

            var jwtSettings = builder.Configuration.GetSection(JwtOptions.ConfigSection);

            /* TODO: Enable for JWT authentication */
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

            builder.Services.AddDefaultIdentity<ApplicationUser>(options =>
            {
                options.SignIn.RequireConfirmedAccount = true;                
            })
                .AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>();
            builder.Services.AddControllersWithViews().AddNewtonsoftJson(options => 
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore);


            // builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.ConfigSection));            
            // builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

            // builder.Services.Configure<SendGridEmailOptions>(builder.Configuration.GetSection(SendGridEmailOptions.ConfigSection));      
            // builder.Services.AddTransient<IEmailSender, SendGridEmailSender>();
            
            builder.Services.Configure<PostMarkEmailOptions>(builder.Configuration.GetSection(PostMarkEmailOptions.ConfigSection));
            builder.Services.AddTransient<IEmailSender, PostMarkEmailSender>();
            
            builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.ConfigSection));
            builder.Services.AddScoped<JwtHandler>();

            builder.Services.ConfigureApplicationCookie(options =>
            {
                // TODO: Redirect to custom login
                // options.LoginPath = "/Home/Privacy";
            });
            
            var app = builder.Build();

            // TODO: Move to dbcontext on creating event
            //using (var scope = app.Services.CreateScope())
            //{
            //    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            //    if (!roleManager.RoleExistsAsync("Admin").Result)
            //    {
            //        _ = roleManager.CreateAsync(new IdentityRole("Admin")).Result;
            //    }
            //}

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

            app.MapRazorPages();

            app.Run();
        }
    }
}