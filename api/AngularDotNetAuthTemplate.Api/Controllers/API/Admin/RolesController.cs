using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using DGates.Identity.Jwt2Fa.Extensions;

namespace AngularDotNetAuthTemplate.Api.Controllers.API.Admin
{
    /// <summary>
    /// Exposes the roles an admin can assign to a user, backed directly by
    /// <see cref="RoleManager{TRole}"/> - the client never hardcodes a role list that
    /// can drift from what actually exists in the database (see DbSeeder for where
    /// roles are actually created).
    /// </summary>
    [Route("api/admin/roles")]
    [ApiController]
    [Authorize(Policy = Jwt2FaPolicies.AdminOnly)]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        /// <summary>Creates the controller with its injected role store.</summary>
        public RolesController(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        /// <summary>Returns every role name currently in the database, alphabetically.</summary>
        [HttpGet]
        public IActionResult Get()
        {
            var roleNames = _roleManager.Roles
                .Select(r => r.Name)
                .Where(name => name != null)
                .OrderBy(name => name)
                .ToArray();

            return Ok(roleNames);
        }
    }
}
