using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AngularAndDotNetCoreAuthTemplate.Models;
using System.Diagnostics;

namespace AngularAndDotNetCoreAuthTemplate.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }


        [Route("~/")]
        [Route("~/home")]        
        [Route("~/profile")]
        [Route("~/admin/users")]
        [Route("~/admin/edit-user/{id?}")]
        [Route("~/admin/register-user")]
        public IActionResult Index()
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "ClientApp", "index.html"), "text/HTML");
        }

        [Route("~/login")]
        public IActionResult Login()
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "ClientApp", "index.html"), "text/HTML");
        }

        [Route("~/forgot-password/reset/{code?}")]        
        public IActionResult ForgotPassword(string? code = null)
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "ClientApp", "index.html"), "text/HTML");
        }

        [Route("~/email-confirmation/{code?}")]
        public IActionResult ConfirmEmail(string? code = null)
        {
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "ClientApp", "index.html"), "text/HTML");
        }

        [Authorize(Roles = "Admin")]
        public IActionResult Privacy()
        {
            return View();
        }

        [Authorize]
        public IActionResult Secure()
        {
            return View("Index");            
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

       
    }
}