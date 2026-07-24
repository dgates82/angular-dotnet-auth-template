using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AngularDotNetAuthTemplate.Api.Models;
using System.Diagnostics;

namespace AngularDotNetAuthTemplate.Api.Controllers
{
    /// <summary>
    /// Serves the Angular SPA shell (<c>index.html</c>) for the app's
    /// top-level client routes, plus a couple of server-rendered Razor views
    /// used outside the SPA (<see cref="Privacy"/>, <see cref="Secure"/>,
    /// <see cref="Error"/>). Most of these explicit routes are now also
    /// covered by the catch-all SPA fallback registered in
    /// <c>Program.cs</c>; they're kept here for routes that need
    /// controller-level behavior (e.g. authorization) rather than a plain
    /// static-file response.
    /// </summary>
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        /// <summary>Creates the controller with its injected logger.</summary>
        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }


        /// <summary>Serves the Angular SPA shell for the app's main client routes.</summary>
        [Route("~/")]
        [Route("~/home")]
        [Route("~/register")]
        [Route("~/profile")]
        [Route("~/admin/users")]
        [Route("~/admin/edit-user/{id?}")]
        [Route("~/admin/register-user")]
        public IActionResult Index()
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "../../client/dist/browser", "index.html"), "text/HTML");
        }

        /// <summary>Serves the Angular SPA shell for the login route.</summary>
        [Route("~/login")]
        public IActionResult Login()
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "../../client/dist/browser", "index.html"), "text/HTML");
        }

        /// <summary>
        /// Serves the Angular SPA shell for the password-reset link sent via
        /// email, which includes a reset <paramref name="code"/> in the URL.
        /// </summary>
        [Route("~/forgot-password/reset/{code?}")]
        public IActionResult ForgotPassword(string? code = null)
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "../../client/dist/browser", "index.html"), "text/HTML");
        }

        /// <summary>
        /// Serves the Angular SPA shell for the email-confirmation link sent
        /// via email, which includes a confirmation <paramref name="code"/>
        /// in the URL.
        /// </summary>
        [Route("~/email-confirmation/{code?}")]
        public IActionResult ConfirmEmail(string? code = null)
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "../../client/dist/browser", "index.html"), "text/HTML");
        }

        /// <summary>Server-rendered privacy page, restricted to the Admin role.</summary>
        [Authorize(Roles = "Admin")]
        public IActionResult Privacy()
        {
            return View();
        }

        /// <summary>
        /// A minimal authenticated endpoint used to smoke-test that a bearer
        /// token is valid, independent of the Angular client.
        /// </summary>
        [Authorize]
        public IActionResult Secure()
        {
            return View("Index");
        }

        /// <summary>
        /// Unhandled-exception view configured via
        /// <c>app.UseExceptionHandler("/Home/Error")</c> in <c>Program.cs</c>.
        /// Explicitly disables response caching so a cached error page is
        /// never replayed for a since-fixed request.
        /// </summary>
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


    }
}