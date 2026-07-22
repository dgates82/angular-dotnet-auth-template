using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Encodings.Web;
using System.Text;
using AngularDotNetAuthTemplate.Api.ExtensionMethods;
using System.Globalization;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Data;

namespace AngularDotNetAuthTemplate.Api.Controllers.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : CustomControllerBase
    {

        private readonly ILogger _logger;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;  
        private readonly ApplicationUserRepository _userRepository;
        private readonly JwtHandler _jwtHandler;
        private readonly IEmailSender _emailSender;
        private readonly ISmsSender _smsSender;
        private readonly UrlEncoder _urlEncoder;
        
        private const int VerificationCodeExpiryMinutes = 6;

        private const string AuthenticatorUriFormat = "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

        public AccountController(ILogger<AccountController> logger, 
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager, 
            ApplicationUserRepository userRepository,
            JwtHandler jwtHandler,
            IEmailSender emailSender,
            ISmsSender smsSender,
            UrlEncoder urlEncoder)
        {
            _logger = logger;
            _signInManager = signInManager;
            _userManager = userManager;      
            _userRepository = userRepository;
            _jwtHandler = jwtHandler;
            _emailSender = emailSender;
            _smsSender = smsSender;
            _urlEncoder = urlEncoder;
        }
        
        
        [HttpGet]
        [Authorize]
        [Route("getuserbyemail")]
        public async Task<IActionResult> GetUserByEmail([FromQuery] string email)
        {
            try
            {
                _logger.LogInformation($"GetUserByEmail | email: {email}");
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return Ok(new ResponseDto { IsSuccess = false });
                }
                
                // Add roles to user dto object for client side
                var roles = await _userManager.GetRolesAsync(user);
                user.Roles = roles.ToList();

                return Ok(user);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving user by email: {email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }
        
        [HttpPost]
        [Route("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerRequestDto)
        {
            _logger.LogDebug($"Register | registerRequestDto: {registerRequestDto.ToJson()}");

            try
            {
                var user = new ApplicationUser
                {
                    UserName = registerRequestDto.Email,
                    Email = registerRequestDto.Email,
                    IsActive = true,
                    HasSetPassword = true
                };

                var result = await _userManager.CreateAsync(user, registerRequestDto.Password);

                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                // Generate a email confirmation token and send email            
                var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                var callbackUrl = Url.Action("ConfirmEmail", "Home", values: null, protocol: Request.Scheme);
                callbackUrl = $"{callbackUrl}?userId={user.Id}";
                callbackUrl = $"{callbackUrl}&emailAddress={registerRequestDto.Email}";
                callbackUrl = $"{callbackUrl}&emailCode={code}";

                await _emailSender.SendEmailAsync(
                    registerRequestDto.Email,
                    "[Application Name] Email Confirmation", // TEMPLATE: Update email subject
                    $"In order to start using [Application Name], you need to verify your email.<br/><br/>Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>.<br/><br/>If you did not request a login to [Application Name], please ignore this email."); // TEMPLATE: Update email body

                _logger.LogInformation($"Register | User created a new account with password.");
                
                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Account.Register | Error registering user: {registerRequestDto.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequestDto userForAuthentication)
        {
            try
            {
                _logger.LogDebug($"Login | email: {userForAuthentication.Email}");
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
                
                var result = await _signInManager.PasswordSignInAsync(userForAuthentication.Email,
                    userForAuthentication.Password
                    , false, lockoutOnFailure: false);

                if (result.Succeeded)
                {
                    var signingCredentials = _jwtHandler.GetSigningCredentials();

                    // Add roles to user dto object for client side
                    var roles = await _userManager.GetRolesAsync(user);
                    user.Roles = roles.ToList();
                    
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
                
                if (result.RequiresTwoFactor)
                {
                    return Ok(new AuthResponseDto
                    {
                        IsAuthSuccessful = false,
                        RequiresTwoFactor = true,
                        TwoFactorMethod = user.TwoFactorMethod ?? "",
                        PhoneNumber = user.TwoFactorMethod == "Phone" ? user.PhoneNumber ?? "" : ""
                    });
                }
                
                
                // Otherwise increment failed login attempts
                await _userManager.AccessFailedAsync(user).ConfigureAwait(false);
                
                // return unauthorized
                return Unauthorized(new AuthResponseDto { ErrorMessage = "Invalid Authentication" });
                
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error logging in user: {userForAuthentication.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Route("login2fa")]
        public async Task<IActionResult> Login2Fa([FromBody] TwoFaAuthRequestDto request)
        {
            try
            {
                _logger.LogDebug($"Login2Fa | email: {request.Email} | code: {request.TwoFactorCode}");
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    // Don't reveal that the user does not exist
                    return Ok(new AuthResponseDto { IsAuthSuccessful = false });
                }
                
                var tokenProvider = GetTokenProvider(request.TwoFactorProvider);

                var result = await _userManager.VerifyTwoFactorTokenAsync(user,
                    tokenProvider,
                    request.TwoFactorCode);

                if (!result)
                {
                    return Ok(new AuthResponseDto
                        { IsAuthSuccessful = false, ErrorMessage = "Invalid Authentication Code" });
                }
                
                // Add roles to user dto object for client side
                var roles = await _userManager.GetRolesAsync(user);
                user.Roles = roles.ToList();
                
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
            catch (Exception e)
            {
                _logger.LogError(e, $"Error logging in user: {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }
        
        [HttpPost]
        [Route("SendTwoFaCode")]
        public async Task<IActionResult> SendTwoFaCode([FromBody] SendVerificationCodeRequestDto request)
        {
            try
            {
                _logger.LogDebug($"Send2FaCode | email: {request.Email}");

                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return Ok(new ResponseDto { IsSuccess = false });
                }

                var tokenProvider = GetTokenProvider(request.Method);
                
                if (string.IsNullOrEmpty(tokenProvider))
                {
                    return Ok(new ResponseDto { IsSuccess = false });
                }

                var code = await _userManager.GenerateTwoFactorTokenAsync(user, tokenProvider);
                
                switch (tokenProvider)
                {
                    case "Authenticator":
                        // Authenticator cannot be used to send codes
                        return Ok(new ResponseDto { IsSuccess = false });
                    case "Email":
                        await _emailSender.SendEmailAsync(
                            request.Email,
                            "[Application Name] 2FA Code", // TEMPLATE: Update email subject
                            $"Your 2FA code is: {code}<br/><br/>This code is valid for {VerificationCodeExpiryMinutes} minutes.<br/><br/>If you did not request a 2FA code please ignore this email.");
                        break;
                    case "Phone":
                        // Use user phone number if 2fa is already enabled
                        var phoneNumber = user.TwoFactorEnabled ? user.PhoneNumber : request.PhoneNumber;
                        _logger.LogDebug($"SendTwoFaCode | Sending 2FA code to {phoneNumber}");
                        
                        // Send SMS
                        // TODO: Enable SMS sending
                        // await _smsSender.SendSmsAsync(phoneNumber, $"Your 2FA code for [Application Name] is: {code}. This code is valid for {VerificationCodeExpiryMinutes}. DO NOT share it with anyone."); // TEMPLATE: Update SMS message
                        break;
                }
                
                _logger.LogInformation($"2FA code sent to {request.Email}");

                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error sending 2FA code email to {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Route("forgotpassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                _logger.LogDebug($"ForgotPassword | forgotPasswordDto: {forgotPasswordDto.ToJson()}");

                // Find user
                var user = await _userManager.FindByEmailAsync(forgotPasswordDto.Email);
                if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
                {
                    // Don't reveal that the user does not exist or is not confirmed
                    return Ok(new ResponseDto { IsSuccess = false });
                }

                // Generate a password reset token and send email            
                var code = await _userManager.GeneratePasswordResetTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                var callbackUrl = Url.Action("ForgotPassword", "Home", values: null, protocol: Request.Scheme);
                callbackUrl = $"{callbackUrl}?code={code}";

                await _emailSender.SendEmailAsync(
                    forgotPasswordDto.Email,
                    "[Application Name] Password Reset", // TEMPLATE: Update email subject
                    $"Forgot your password?<br/>We received a request to reset the password for your account.<br/><br/>To reset your password <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>click here</a>.<br/><br/>If you did not request a password reset please ignore this email.");

                _logger.LogInformation($"Password reset email sent to {forgotPasswordDto.Email}");

                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error sending password reset email to {forgotPasswordDto.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        [HttpPost]
        [Route("resetpassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            try
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

                if (result.Succeeded)
                {
                    // Update HasSetPassword setting on user
                    await _userRepository.SetHasSetPassword(user, true);
                }

                _logger.LogInformation(
                    $"Password reset {(result.Succeeded ? "was successful" : "failed")} for {request.Email}");

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error resetting password for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Authorize]
        [Route("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            try
            {
                _logger.LogDebug($"ChangePassword | email: {request.Email}");
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    // Don't reveal that the user does not exist
                    return Ok(new ResponseDto { IsSuccess = false });
                }

                var changePasswordResult =
                    await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

                if (!changePasswordResult.Succeeded)
                {
                    foreach (var error in changePasswordResult.Errors)
                    {
                        // HACK: Should we be returning errors here?
                        _logger.LogError($"Error adding password: {error.Description}");
                    }

                    return Ok(new ResponseDto { IsSuccess = false });
                }

                await _signInManager.RefreshSignInAsync(user);
                var message = "Your password has been set.";

                _logger.LogInformation("User changed their password successfully.");

                return Ok(new ResponseDto { IsSuccess = true, Message = message });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error changing password for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }
        

        [HttpPost]
        //[Authorize]
        [Route("sendemailconfirmation")]
        public async Task<IActionResult> SendEmailConfirmation([FromBody] SendEmailConfirmationRequestDto request)
        {
            try
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
                    "[Application Name] Email Confirmation", // TEMPLATE: Update email subject
                    $"In order to start using [Application Name], you need to verify your email.<br/><br/>Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>.<br/><br/>If you did not request a login to SkillSpring, please ignore this email."); // TEMPLATE: Update email body

                _logger.LogInformation($"Email confirmation sent to {request.Email}");

                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error sending email confirmation to {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        [HttpPost]
        [Route("confirmEmail")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequestDto request)
        {
            try
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

                _logger.LogInformation(
                    $"Email confirmation {(result.Succeeded ? "was successful" : "failed")} for {request.UserId}");

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error confirming email for {request.UserId}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        [HttpPost]        
        [Route("enableauthenticator")]
        public async Task<IActionResult> EnableAuthenticator([FromBody] EnableAuthenticatorRequestDto request)
        {
            try
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
            catch (Exception e)
            {
                _logger.LogError(e, $"Error enabling 2FA for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }
                

        [HttpPost]        
        [Route("verifyauthenticator")]
        public async Task<ActionResult> VerifyAuthenticator([FromBody] VerifyAuthenticatorRequestDto request)
        {
            try
            {
                _logger.LogDebug($"VerifyAuthenticator | email: {request.Email} | code: {request.Code} | method: {request.Method}");
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return Ok(new ResponseDto { IsSuccess = false });
                }
                
                var tokenProvider = GetTokenProvider(request.Method);
                
                if (string.IsNullOrEmpty(tokenProvider))
                {
                    return Ok(new ResponseDto { IsSuccess = false });
                }

                var is2faTokenValid = await _userManager.VerifyTwoFactorTokenAsync(
                    user, tokenProvider, request.Code);

                if (!is2faTokenValid)
                {
                    return Ok(new VerifyAuthenticatorResponseDto
                    {
                        IsVerified = false,
                        Message = "Could not verify authentication code."
                    });
                }

                await _userManager.SetTwoFactorEnabledAsync(user, true);

                // Set 2fa method on user
                user.TwoFactorMethod = tokenProvider;
                
                // If using sms, set phone number
                if (tokenProvider == "Phone")
                {
                    user.PhoneNumber = request.PhoneNumber;
                }
                
                await _userManager.UpdateAsync(user);
                
                var userId = await _userManager.GetUserIdAsync(user);
                _logger.LogInformation($"User with ID '{userId}' has enabled 2FA with {request.Method}.");

                var response = new VerifyAuthenticatorResponseDto
                {
                    IsVerified = true,
                    Message = "Your 2FA authentication has been verified."
                };


                if (tokenProvider == "Authenticator")
                {
                    // HACK: Since we can't clear out existing recovery codes we are just generating new ones every time
                    var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
                    response.Codes = recoveryCodes.ToArray();
                }

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error verifying 2FA for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Authorize]
        [Route("resetauthenticator")]
        public async Task<IActionResult> ResetAuthenticator([FromBody] EnableAuthenticatorRequestDto request)
        {
            try
            {
                _logger.LogDebug($"ResetAuthenticator | email: {request.Email}");
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
                }

                // Get update user to track who updated
                var adminUser = GetCurrentUser();

                // Validate admin user before resetting authenticator
                if (adminUser == null || await _userManager.IsInRoleAsync(adminUser, "Admin") == false)
                {
                    return BadRequest("Admin user is required to reset authenticator.");
                }

                await _userManager.SetTwoFactorEnabledAsync(user, false);
                await _userManager.ResetAuthenticatorKeyAsync(user);
                
                // Set 2fa method on user to null
                user.TwoFactorMethod = "";
                await _userManager.UpdateAsync(user);
                
                _logger.LogInformation(
                    $"Authentication app key for user with ID '{user.Id}' has been reset by '{adminUser.Id}'");

                await _signInManager.RefreshSignInAsync(user);
                var message =
                    "Authenticator app key has been reset. User will need to configure their authenticator app using a new key.";


                return Ok(new ResponseDto { IsSuccess = true, Message = message });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error resetting authenticator for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        private string GetTokenProvider(string method)
        {
            _logger.LogDebug($"GetTokenProvider | method: {method}");
            var tokenProvider = method switch
            {
                "Authenticator" => "Authenticator",
                "Email" => "Email",
                "Phone" or "Sms" => "Phone",
                _ => null
            };
            _logger.LogDebug($"GetTokenProvider | tokenProvider: {tokenProvider}");
            return tokenProvider ?? "";
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
                _urlEncoder.Encode("AngularDotNetAuthTemplate.Api"), // TEMPLATE: Change to your app's name
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
