using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Admin;
using DGates.Identity.Jwt2Fa.Dtos;
using DGates.Identity.Jwt2Fa.Extensions;
using DGates.Identity.Jwt2Fa.Services;

namespace AngularDotNetAuthTemplate.Api.Controllers.API.Admin
{
    /// <summary>
    /// Admin-facing profile-field updates for user accounts. Everything else about user
    /// management (list, get, create, activate/deactivate, unlock, email/role changes) is
    /// served directly by DGates.Identity.Jwt2Fa's own admin endpoints under
    /// <c>api/auth</c> - this controller only owns the app-specific profile fields
    /// (name/phone/address) that package can't know about.
    /// </summary>
    [Route("api/admin/user")]
    [ApiController]
    [Authorize(Policy = Jwt2FaPolicies.AdminOnly)]
    public class UserController : ControllerBase
    {
        private readonly ILogger _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuthCoreService<ApplicationUser> _authCoreService;

        /// <summary>Creates the controller with its injected Identity and Jwt2Fa dependencies.</summary>
        public UserController(ILogger<UserController> logger,
            UserManager<ApplicationUser> userManager,
            IAuthCoreService<ApplicationUser> authCoreService)
        {
            _logger = logger;
            _userManager = userManager;
            _authCoreService = authCoreService;
        }

        /// <summary>
        /// Updates a user's profile fields locally, then delegates the email/role portion
        /// of the request to <see cref="IAuthCoreService{TUser}.AdminUpdateUserAsync"/> in
        /// the same call - the client still only makes one request even though two
        /// systems handle it.
        /// </summary>
        /// <param name="request">The user's id, new profile field values, and role list.</param>
        /// <returns>The updated user projection, 404 if not found, or 400 with validation errors.</returns>
        [HttpPut]
        public async Task<IActionResult> Put([FromBody] UpdateUserRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Updating user: {request.Id}");

                var user = await _userManager.FindByIdAsync(request.Id);
                if (user == null)
                {
                    return NotFound();
                }

                var currentUser = await _userManager.GetUserAsync(User);

                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.PhoneNumber = request.PhoneNumber;
                user.StreetAddress = request.StreetAddress;
                user.City = request.City;
                user.ZipCode = request.ZipCode;
                user.State = request.State;
                user.UpdatedById = currentUser!.Id;
                user.UpdatedAt = DateTime.Now;

                var profileResult = await _userManager.UpdateAsync(user);

                var updateResult = await _authCoreService.AdminUpdateUserAsync(request.Id, new AdminUpdateUserRequestDto
                {
                    Email = user.Email!,
                    Roles = request.Roles
                });

                if (!profileResult.Succeeded)
                {
                    return BadRequest(profileResult.Errors);
                }

                return updateResult.Kind switch
                {
                    Jwt2FaResultKind.Ok => Ok(updateResult.Value),
                    Jwt2FaResultKind.BadRequest => BadRequest(updateResult.Error),
                    Jwt2FaResultKind.NotFound => NotFound(updateResult.Error),
                    _ => StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error updating user: {request.Id}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }
    }
}
