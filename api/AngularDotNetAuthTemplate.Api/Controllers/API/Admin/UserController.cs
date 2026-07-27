using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Data;
using System.Security.Cryptography;
using System.Text;


namespace AngularDotNetAuthTemplate.Api.Controllers.API.Admin
{
    /// <summary>
    /// Admin-facing user management: create, update, list, deactivate/activate,
    /// and unlock accounts. Distinct from the self-service endpoints on
    /// <see cref="AngularDotNetAuthTemplate.Api.Controllers.API.AccountController"/>.
    /// </summary>
    // [Route("api/admin/[controller]")]
    [Route("api/admin/user")]
    [ApiController]
    public class UserController : CustomControllerBase
    {
        private readonly ILogger _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationUserRepository _userRepository;

        /// <summary>Creates the controller with its injected Identity and repository dependencies.</summary>
        public UserController(ILogger<UserController> logger,
            UserManager<ApplicationUser> userManager,
            ApplicationUserRepository userRepository
            )
        {
            _logger = logger;
            _userManager = userManager;
            _userRepository = userRepository;
        }
        
        /// <summary>Gets a single user by ID, including their assigned roles.</summary>
        /// <param name="id">The user's ID.</param>
        [HttpGet]
        [Authorize]
        [Route("get/{id?}")]
        public async Task<IActionResult> Get([FromQuery] string id)
        {
            try
            {
                _logger.LogDebug($"Getting user by id: {id}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var user = await _userRepository.GetAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
                user.Roles = roles.ToList();

                return Ok(new ApplicationUserDto(user));
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving user by id: {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        /// <summary>Lists all users, including each user's assigned roles.</summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get()
        {
            try
            {
                _logger.LogDebug($"Getting all users");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var users = (await _userRepository.GetAsync()).ToList();

                // add roles to user
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
                    user.Roles = roles.ToList();
                }

                return Ok(users.Select(u => new ApplicationUserDto(u)));
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving all users");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        /// <summary>
        /// Creates a new user with a randomly generated password and assigns the
        /// requested roles. Intended for admin-initiated account creation, where
        /// the user sets their own password later via the email confirmation flow.
        /// </summary>
        /// <param name="newUser">The new user's profile fields and requested roles.</param>
        /// <returns>The created <see cref="ApplicationUserDto"/>, or 400 with Identity's validation errors.</returns>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Post([FromBody] ApplicationUser newUser)
        {
            try
            {
                _logger.LogInformation($"Creating new user | email: {newUser.Email}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var currentUser = GetCurrentUser()!;

                var user = new ApplicationUser
                {
                    FirstName = newUser.FirstName,
                    LastName = newUser.LastName,
                    Email = newUser.Email,
                    UserName = newUser.Email,
                    PhoneNumber = newUser.PhoneNumber,
                    StreetAddress = newUser.StreetAddress,
                    City = newUser.City,
                    ZipCode = newUser.ZipCode,
                    State = newUser.State,
                    CreatedById = currentUser.Id,
                    CreatedAt = DateTime.Now,
                    UpdatedById = currentUser.Id,
                    UpdatedAt = DateTime.Now
                };

                // Generate random password 
                var pwdBuilder = new StringBuilder();
                pwdBuilder.Append(RandomString(4, true));
                pwdBuilder.Append("_");
                pwdBuilder.Append(RandomNumber(1000, 9999));
                pwdBuilder.Append(RandomString(2, false));
                var pwd = pwdBuilder.ToString();

                var result = await _userManager.CreateAsync(user, pwd);

                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }
                
                // Add user roles
                if (newUser.Roles.Count > 0)
                {
                    foreach (var role in newUser.Roles)
                    {
                        await _userManager.AddToRoleAsync(user, role);
                    }
                }

                return Ok(new ApplicationUserDto(user));
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error creating new user | email: {newUser.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        /// <summary>Updates a user's profile fields and role assignments.</summary>
        /// <param name="updateUser">The user's ID plus the new profile field values and role list.</param>
        /// <returns>The updated <see cref="ApplicationUserDto"/>, 404 if not found, or 400 with Identity's validation errors.</returns>
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Put([FromBody] ApplicationUser updateUser)
        {
            try
            {
                _logger.LogInformation($"Updating user: {updateUser.Id}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var user = await _userRepository.GetAsync(updateUser.Id);

                if (user == null)
                {
                    return NotFound();
                }

                var currentUser = GetCurrentUser()!;

                user.FirstName = updateUser.FirstName;
                user.LastName = updateUser.LastName;
                user.PhoneNumber = updateUser.PhoneNumber;
                user.StreetAddress = updateUser.StreetAddress;
                user.City = updateUser.City;
                user.ZipCode = updateUser.ZipCode;
                user.State = updateUser.State;

                user.UpdatedById = currentUser.Id;
                user.UpdatedAt = DateTime.Now;

                var result = await _userManager.UpdateAsync(user);
                
                // Update user roles
                var currentRoles = await _userManager.GetRolesAsync(user);
                var rolesToRemove = currentRoles.Except(updateUser.Roles).ToList();
                var rolesToAdd = updateUser.Roles.Except(currentRoles).ToList();

                foreach (var role in rolesToRemove)
                {
                    await _userManager.RemoveFromRoleAsync(user, role);
                }

                foreach (var role in rolesToAdd)
                {
                    await _userManager.AddToRoleAsync(user, role);
                }

                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                return Ok(new ApplicationUserDto(user));
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error updating user: {updateUser.Id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        /// <summary>Deactivates a user account, preventing further login.</summary>
        /// <param name="id">The ID of the user to deactivate.</param>
        [HttpPost]
        [Authorize]
        [Route("deactivate/{id?}")]
        public async Task<IActionResult> Deactivate([FromQuery] string id)
        {
            try
            {
                _logger.LogInformation($"Deactivating user: {id}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var currentUser = GetCurrentUser()!;

                var user = await _userRepository.GetAsync(id);

                if (user == null)
                {
                    return NotFound();
                }

                await _userRepository.DeactivateAsync(id, currentUser.Id);

                return Ok();
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error deactivating user: {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        /// <summary>Reactivates a previously deactivated user account.</summary>
        /// <param name="id">The ID of the user to activate.</param>
        [HttpPost]
        [Authorize]
        [Route("activate/{id?}")]
        public async Task<IActionResult> Activate([FromQuery] string id)
        {
            try
            {
                _logger.LogInformation($"Activating user: {id}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var currentUser = GetCurrentUser()!;

                var user = await _userRepository.GetAsync(id);

                if (user == null)
                {
                    return NotFound();
                }

                await _userRepository.ActivateAsync(id, currentUser.Id);

                return Ok();
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error activating user: {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }
        
        /// <summary>Clears a user's lockout, ending any active lockout from failed login attempts immediately.</summary>
        /// <param name="id">The ID of the user to unlock.</param>
        [HttpPost]
        [Authorize]
        [Route("unlock/{id?}")]
        public async Task<IActionResult> Unlock([FromQuery] string id)
        {
            try
            {
                _logger.LogInformation($"Unlocking user: {id}");

                if (!await IsCurrentUserAdminAsync())
                {
                    return Forbid();
                }

                var user = await _userRepository.GetAsync(id);

                if (user == null)
                {
                    return NotFound();
                }

                // Set lockout end date to now
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow);

                return Ok();
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error unlocking user: {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }


        /// <summary>Whether the caller (from the JWT's embedded user claim) is in the Admin role.</summary>
        private async Task<bool> IsCurrentUserAdminAsync()
        {
            var currentUser = GetCurrentUser();
            return currentUser != null && await _userManager.IsInRoleAsync(currentUser, "Admin");
        }

        /// <summary>Generates a random string of uppercase (or lowercase) letters, used to build a random initial password.</summary>
        private static string RandomString(int size, bool lowerCase)
        {
            var builder = new StringBuilder();
            char ch;
            for (var i = 0; i < size; i++)
            {
                ch = Convert.ToChar(RandomNumberGenerator.GetInt32(65, 91));
                builder.Append(ch);
            }
            if (lowerCase)
                return builder.ToString().ToLower();
            return builder.ToString();
        }

        /// <summary>Generates a random number in <c>[min, max)</c>, used to build a random initial password.</summary>
        private static int RandomNumber(int min, int max)
        {
            return RandomNumberGenerator.GetInt32(min, max);
        }

    }
}
