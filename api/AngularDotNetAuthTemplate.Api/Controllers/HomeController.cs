using Microsoft.AspNetCore.Mvc;
using AngularDotNetAuthTemplate.Api.Models;
using System.Diagnostics;

namespace AngularDotNetAuthTemplate.Api.Controllers
{
    /// <summary>
    /// Backs the production error handler
    /// (<c>app.UseExceptionHandler("/Home/Error")</c> in <c>Program.cs</c>).
    /// The Angular SPA shell and all API behavior are served elsewhere — the
    /// SPA fallback in <c>Program.cs</c> and
    /// <see cref="AngularDotNetAuthTemplate.Api.Controllers.API.AccountController"/>,
    /// respectively.
    /// </summary>
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        /// <summary>Creates the controller with its injected logger.</summary>
        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
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