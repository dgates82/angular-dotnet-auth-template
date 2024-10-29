using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AngularAndDotNetCoreAuthTemplate.Models;
using AngularAndDotNetCoreAuthTemplate.Data;
using System.Text;


namespace AngularAndDotNetCoreAuthTemplate.Controllers.API.Admin
{
    // [Route("api/admin/[controller]")]
    [Route("api/admin/user")]
    [ApiController]
    public class UserController : CustomControllerBase
    {
        private readonly ILogger _logger;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationUserRepository _userRepository;

        public UserController(ILogger<UserController> logger, 
            SignInManager<ApplicationUser> signInManager, 
            UserManager<ApplicationUser> userManager,
            ApplicationUserRepository userRepository            
            )
        {
            _logger = logger;
            _signInManager = signInManager;
            _userManager = userManager;
            _userRepository = userRepository;
        }
        
        [HttpGet]
        [Route("get/{id?}")]        
        public async Task<IActionResult> Get([FromQuery] string id)
        {
            try
            {
                _logger.LogDebug($"Getting user by id: {id}");

                var user = await _userRepository.GetAsync(id);

                user.IsAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                return Ok(user);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving user by id: {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                _logger.LogDebug($"Getting all users");

                var users = await _userRepository.GetAsync();

                foreach (var user in users)
                {
                    user.IsAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                }
                
                return Ok(users);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving all users");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Post([FromBody] ApplicationUser newUser)
        {
            try
            {
                _logger.LogInformation($"Creating new user | email: {newUser.Email}");

                // Get update user to track who updated                                              
                var currentUser = GetCurrentUser();

                if (currentUser == null)
                {
                    return BadRequest("Authenticated user token could not be decoded. Please re-login and try again");
                }

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

                // Add admin role
                if (newUser.IsAdmin)
                {
                    await _userManager.AddToRoleAsync(user, "Admin");
                }

                return Ok(user);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error creating new user | email: {newUser.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Put([FromBody] ApplicationUser updateUser)
        {
            try
            {
                _logger.LogInformation($"Updating user: {updateUser.Id}");

                var user = await _userRepository.GetAsync(updateUser.Id);

                if (user == null)
                {
                    return NotFound();
                }

                // Get update user to track who updated                                              
                var currentUser = GetCurrentUser();

                if (currentUser == null)
                {
                    return BadRequest("Authenticated user token could not be decoded. Please re-login and try again");
                }

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

                // Update admin role
                if (await _userManager.IsInRoleAsync(user, "Admin") != updateUser.IsAdmin)
                {
                    if (updateUser.IsAdmin)
                    {
                        await _userManager.AddToRoleAsync(user, "Admin");
                    }
                    else
                    {
                        await _userManager.RemoveFromRoleAsync(user, "Admin");
                    }
                }

                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                return Ok(user);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error updating user: {updateUser.Id}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        [HttpPost]
        [Authorize]
        [Route("deactivate/{id?}")]
        public async Task<IActionResult> Deactivate([FromQuery] string id)
        {
            try
            {
                _logger.LogInformation($"Deactivating user: {id}");

                // Get update user to track who updated                                              
                var currentUser = GetCurrentUser();

                if (currentUser == null)
                {
                    return BadRequest("Authenticated user token could not be decoded. Please re-login and try again");
                }

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

        [HttpPost]
        [Authorize]
        [Route("activate/{id?}")]
        public async Task<IActionResult> Activate([FromQuery] string id)
        {
            try
            {
                _logger.LogInformation($"Activating user: {id}");

                // Get update user to track who updated                                              
                var currentUser = GetCurrentUser();

                if (currentUser == null)
                {
                    return BadRequest("Authenticated user token could not be decoded. Please re-login and try again");
                }

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


        private string RandomString(int size, bool lowerCase)
        {
            var builder = new StringBuilder();
            var random = new Random();
            char ch;
            for (var i = 0; i < size; i++)
            {
                ch = Convert.ToChar(Convert.ToInt32(Math.Floor(26 * random.NextDouble() + 65)));
                builder.Append(ch);
            }
            if (lowerCase)
                return builder.ToString().ToLower();
            return builder.ToString();
        }

        private int RandomNumber(int min, int max)
        {
            var random = new Random();
            return random.Next(min, max);
        }

    }
}
