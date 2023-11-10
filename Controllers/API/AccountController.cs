using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects;
using AngularAndDotNetCoreAuthTemplate.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text;
using AngularAndDotNetCoreAuthTemplate.ExtensionMethods;
using System.Globalization;
using AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account;
using AngularAndDotNetCoreAuthTemplate.Models;
using AngularAndDotNetCoreAuthTemplate.Data;
using System.Text.Json;

namespace AngularAndDotNetCoreAuthTemplate.Controllers.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {

        private readonly ILogger _logger;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;  
        private readonly ApplicationUserRepository _userRepository;
        private readonly JwtHandler _jwtHandler;
        private readonly IEmailSender _emailSender;
        private readonly UrlEncoder _urlEncoder;

        private const string AuthenticatorUriFormat = "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

        public AccountController(ILogger<AccountController> logger, 
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager, 
            ApplicationUserRepository userRepository,
            JwtHandler jwtHandler,
            IEmailSender emailSender,
            UrlEncoder urlEncoder)
        {
            _logger = logger;
            _signInManager = signInManager;
            _userManager = userManager;      
            _userRepository = userRepository;
            _jwtHandler = jwtHandler;
            _emailSender = emailSender;
            _urlEncoder = urlEncoder;
        }

        // TODO: Could this be refactored into multiple controllers? 
        
        [HttpGet]
        [Authorize]
        [Route("getuserbyemail")]
        public async Task<IActionResult> GetUserByEmail([FromQuery] string email)
        {            
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Ok(new ResponseDto { IsSuccess = false });
            }

            user.IsAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            // var roles = await _userManager.GetRolesAsync(user);
            // var result = new ApplicationUserDto(user, roles.Contains("Admin")); 

            return Ok(user);
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequestDto userForAuthentication)
        {            
            var user = await _userManager.FindByEmailAsync(userForAuthentication.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return Ok(new AuthResponseDto { IsAuthSuccessful = false });
            }

            // Check if user is active first
            if (!user.IsActive)
            {
                return Ok(new AuthResponseDto { IsAuthSuccessful = false, ErrorMessage = "User is not active" });
            }

            var result = await _signInManager.PasswordSignInAsync(userForAuthentication.Email, userForAuthentication.Password
                , false, lockoutOnFailure: false);                                    

            if (result.Succeeded)
            {
                var signingCredentials = _jwtHandler.GetSigningCredentials();
                                
                user.IsAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                var claims = _jwtHandler.GetClaims(user);
                var tokenOptions = _jwtHandler.GenerateTokenOptions(signingCredentials, claims);
                var token = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

                return Ok(new AuthResponseDto
                {
                    IsAuthSuccessful = true,
                    Token = token,    
                    RequiresTwoFactor = user.TwoFactorEnabled,
                    User = user
                });
            }            
            else if (result.RequiresTwoFactor)
            {
                return Ok(new AuthResponseDto
                {
                    IsAuthSuccessful = false,
                    RequiresTwoFactor = true
                });                
            }
            else
            {
                return Unauthorized(new AuthResponseDto { ErrorMessage = "Invalid Authentication" });
            }            
        }

        [HttpPost]
        [Route("login2fa")]
        public async Task<IActionResult> Login2Fa([FromBody] TwoFaAuthRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return Ok(new AuthResponseDto { IsAuthSuccessful = false });
            }

            var result = await _userManager.VerifyTwoFactorTokenAsync(user, 
                _userManager.Options.Tokens.AuthenticatorTokenProvider, request.TwoFactorCode);

            if (result)            {                

                user.IsAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                var signingCredentials = _jwtHandler.GetSigningCredentials();

                // var userDto = new ApplicationUserDto(user, roles.Contains("Admin"));

                var claims = _jwtHandler.GetClaims(user);
                var tokenOptions = _jwtHandler.GenerateTokenOptions(signingCredentials, claims);
                var token = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

                return Ok(new AuthResponseDto
                {
                    IsAuthSuccessful = true,
                    Token = token,
                    RequiresTwoFactor = true,
                    User = user
                });
            }
            else
            {
                // return Unauthorized(new AuthResponseDto { ErrorMessage = "Invalid Authentication" });
                return Ok(new AuthResponseDto { IsAuthSuccessful = false, ErrorMessage = "Invalid Authentication Code" });
            }

        }

        [HttpPost]
        [Route("forgotpassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            _logger.LogDebug($"ForgotPassword | forgotPasswordDto: {forgotPasswordDto.ToJson()}");

            // Find user
            var user = await _userManager.FindByEmailAsync(forgotPasswordDto.Email);
            if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            {
                // Don't reveal that the user does not exist or is not confirmed
                return Ok(new ResponseDto { IsSuccess = false});
            }

            // Generate a password reset token and send email            
            var code = await _userManager.GeneratePasswordResetTokenAsync(user);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
            
            var callbackUrl = Url.Action("ForgotPassword", "Home", values: null, protocol: Request.Scheme);
            callbackUrl = $"{callbackUrl}?code={code}";
            
            await _emailSender.SendEmailAsync(
                forgotPasswordDto.Email,
                "Auth Template Password Reset",
                $"Forgot your password?<br/>We received a request to reset the password for your account.<br/><br/>To reset your password <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>click here</a>.<br/><br/>If you did not request a password reset please ignore this email.");

            _logger.LogInformation($"Password reset email sent to {forgotPasswordDto.Email}");

            return Ok(new ResponseDto { IsSuccess = true});

        }

        [HttpPost]
        [Route("resetpassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            _logger.LogDebug($"ResetPassword | email: {request.Email} | code: {request.Code}");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return Ok(new ResponseDto { IsSuccess = false });
            }

            var code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Code));

            var result = await _userManager.ResetPasswordAsync(user, code, request.Password);

            var response = new ResponseDto
            {
                IsSuccess = result.Succeeded
            };

            // Update HasSetPassword setting on user
            await _userRepository.SetHasSetPassword(user.Id, true);

            _logger.LogInformation($"Password reset {(result.Succeeded ? "was successful" : "failed")} for {request.Email}");
                        
            return Ok(response);

        }

        [HttpPost]
        [Authorize]
        [Route("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            _logger.LogDebug($"ChangePassword | email: {request.Email}");
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return Ok(new ResponseDto { IsSuccess = false });
            }

            var changePasswordResult = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (!changePasswordResult.Succeeded)
            {
                foreach (var error in changePasswordResult.Errors)
                {                    
                    // TODO: Return errors
                    _logger.LogError($"Error adding password: {error.Description}");
                }
                return Ok(new ResponseDto { IsSuccess = false });
            }

            await _signInManager.RefreshSignInAsync(user);
            var message = "Your password has been set.";

            _logger.LogInformation("User changed their password successfully.");

            return Ok(new ResponseDto { IsSuccess = true, Message = message });
        }

        [HttpPost]
        //[Authorize]
        [Route("sendemailconfirmation")]
        public async Task<IActionResult> SendEmailConfirmation([FromBody] SendEmailConfirmationRequestDto request)
        {
            _logger.LogDebug($"SendEmailConfirmation | email: {request.Email}");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {                             
                return Ok(new ResponseDto { IsSuccess = false });                
            }
            
            var emailCode = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            emailCode = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(emailCode));

            var passwordResetCode = await _userManager.GeneratePasswordResetTokenAsync(user);
            passwordResetCode = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(passwordResetCode));
                        
            var callbackUrl = Url.Action("ConfirmEmail", "Home", values: null, protocol: Request.Scheme);

            callbackUrl = $"{callbackUrl}?userId={user.Id}";
            callbackUrl = $"{callbackUrl}&emailCode={emailCode}";
            
            // Only set password reset code if user has not set a password
            if (!user.HasSetPassword)
            {
                callbackUrl = $"{callbackUrl}&passwordResetCode={passwordResetCode}";
                callbackUrl = $"{callbackUrl}&isFirstLogin=true";
            }           

            await _emailSender.SendEmailAsync(
                               request.Email,
                               "Auth Template Email Confirmation", 
                               $"In order to start using Auth Template, you need to verify your email.<br/><br/>Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>.<br/><br/>If you did not request a login to SkillSpring, please ignore this email.");

            _logger.LogInformation($"Email confirmation sent to {request.Email}");

            return Ok(new ResponseDto { IsSuccess = true });

        }

        [HttpPost]
        [Route("confirmEmail")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequestDto request)
        {
             _logger.LogDebug($"ConfirmEmail | userId: {request.UserId} | code: {request.Code}");

            var user = await _userManager.FindByIdAsync(request.UserId);            
            if (user == null)
            {
                // Do not let the user know email does not exist 
                return Ok(new ResponseDto { IsSuccess = false });
            }

            var emailCode = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Code));

            var result = await _userManager.ConfirmEmailAsync(user, emailCode);

            var response = new ResponseDto
            {
                IsSuccess = result.Succeeded
            };

            _logger.LogInformation($"Email confirmation {(result.Succeeded ? "was successful" : "failed")} for {request.UserId}");

            return Ok(response);

        }

        [HttpPost]        
        [Route("enableauthenticator")]
        public async Task<IActionResult> EnableAuthenticator([FromBody] EnableAuthenticatorRequestDto request)
        {
            _logger.LogDebug($"Enable2Fa | email: {request.Email}");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Ok(new ResponseDto { IsSuccess = false });
            }

            var formattedKey = await GetSharedKey(user);
            var authenticatorUri = await GetAuthenticatorUri(user);

            var result = new EnableAuthenticatorResponseDto
            {
                SharedKey = formattedKey,
                AuthenticatorUri = authenticatorUri
            };

            return Ok(result);

        }
                

        [HttpPost]        
        [Route("verifyauthenticator")]
        public async Task<ActionResult> VerifyAuthenticator([FromBody] VerifyAuthenticatorRequestDto request)
        {                        
            _logger.LogDebug($"VerifyAuthenticator | email: {request.Email} | code: {request.Code}");
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Ok(new ResponseDto { IsSuccess = false });
            }

            var is2faTokenValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

            if (!is2faTokenValid)
            {
                return Ok(new VerifyAuthenticatorResponseDto 
                { 
                    IsVerified = false, 
                    Message = "Could not verify authentication code."
                });
            }

            await _userManager.SetTwoFactorEnabledAsync(user, true);
            var userId = await _userManager.GetUserIdAsync(user);
            _logger.LogInformation("User with ID '{UserId}' has enabled 2FA with an authenticator app.", userId);

            var response = new VerifyAuthenticatorResponseDto
            {
                IsVerified = true,
                Message = "Your authenticator app has been verified."
            };            


            //var countOfRecoveryCodes = await _userManager.CountRecoveryCodesAsync(user);            
            //if (countOfRecoveryCodes == 0)
            //{                
            //}
            
            // HACK: Since we can't clear out existing recovery codes we are just generating new ones every time
            var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
            response.Codes = recoveryCodes.ToArray();

            return Ok(response);
        }

        [HttpPost]
        [Authorize]
        [Route("resetauthenticator")]
        public async Task<IActionResult> ResetAuthenticator([FromBody] EnableAuthenticatorRequestDto request)
        {            
            _logger.LogDebug($"ResetAuthenticator | email: {request.Email}");
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
            }

            // Get update user to track who updated                                              
            // TODO: Validate admin user before resetting authenticator
            var adminUser = JsonSerializer.Deserialize<ApplicationUser>(User.FindFirst("user").Value);

            await _userManager.SetTwoFactorEnabledAsync(user, false);
            await _userManager.ResetAuthenticatorKeyAsync(user);            
            _logger.LogInformation($"Authentication app key for user with ID '{user.Id}' has been reset by '{adminUser.Id}'");

            await _signInManager.RefreshSignInAsync(user);
            var message = "Authenticator app key has been reset. User will need to configure their authenticator app using a new key.";


            return Ok(new ResponseDto { IsSuccess = true, Message = message });

        }


        private async Task<string> GetUnformattedKey(ApplicationUser user)
        {
            // Load the authenticator key & QR code URI to display on the form
            var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(unformattedKey))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            }

            return unformattedKey;
        }

        private async Task<string> GetSharedKey(ApplicationUser user)
        {
            var unformattedKey = await GetUnformattedKey(user);
            var formattedKey = FormatKey(unformattedKey);

            return formattedKey;

        }

        private async Task<string> GetAuthenticatorUri(ApplicationUser user)
        {
            var unformattedKey = await GetUnformattedKey(user);
            var email = await _userManager.GetEmailAsync(user);
            var authenticatorUri = GenerateQrCodeUri(email, unformattedKey);

            return authenticatorUri;
        }                

        private string FormatKey(string unformattedKey)
        {
            var result = new StringBuilder();
            int currentPosition = 0;
            while (currentPosition + 4 < unformattedKey.Length)
            {
                result.Append(unformattedKey.AsSpan(currentPosition, 4)).Append(' ');
                currentPosition += 4;
            }
            if (currentPosition < unformattedKey.Length)
            {
                result.Append(unformattedKey.AsSpan(currentPosition));
            }

            return result.ToString().ToLowerInvariant();
        }

        private string GenerateQrCodeUri(string email, string unformattedKey)
        {
            return string.Format(
                CultureInfo.InvariantCulture,
                AuthenticatorUriFormat,
                _urlEncoder.Encode("Skill Spring"),
                _urlEncoder.Encode(email),
                unformattedKey);
        }


        [HttpGet]
        [Route("secure")]
        [Authorize]
        public IActionResult Secure()
        {
            return Ok("Got it!");
        }
               

    }
}
