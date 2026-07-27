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
    /// <summary>
    /// Handles registration, login, password reset/change, email confirmation,
    /// and two-factor authentication (email, SMS, and authenticator app) for
    /// the Angular client. Successful logins return a JWT (see
    /// <see cref="JwtHandler"/>) rather than an authentication cookie.
    /// </summary>
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

        /// <summary>Creates the controller with its injected Identity, JWT, and notification dependencies.</summary>
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
        
        
        /// <summary>Looks up a user by email, including their assigned roles.</summary>
        /// <param name="email">The email address to search for.</param>
        /// <returns>
        /// The matching <see cref="ApplicationUserDto"/> with <c>Roles</c> populated,
        /// or a <see cref="ResponseDto"/> with <c>IsSuccess = false</c> if no user
        /// with that email exists.
        /// </returns>
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

                return Ok(new ApplicationUserDto(user));
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error retrieving user by email: {email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }
        
        /// <summary>
        /// Creates a new user account and emails a confirmation link
        /// (handled client-side via <c>HomeController.ConfirmEmail</c>).
        /// </summary>
        /// <param name="registerRequestDto">The new user's email and password.</param>
        /// <returns>
        /// <see cref="ResponseDto"/> with <c>IsSuccess = true</c> on success, or a
        /// 400 with Identity's validation errors if account creation failed
        /// (e.g. password policy, duplicate email).
        /// </returns>
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

                var callbackUrl = $"{Request.Scheme}://{Request.Host}/email-confirmation";
                callbackUrl = $"{callbackUrl}?userId={user.Id}";
                callbackUrl = $"{callbackUrl}&emailAddress={registerRequestDto.Email}";
                callbackUrl = $"{callbackUrl}&emailCode={code}";

                await _emailSender.SendEmailAsync(
                    registerRequestDto.Email,
                    "[Application Name] Email Confirmation", // TODO(template): Update email subject
                    $"In order to start using [Application Name], you need to verify your email.<br/><br/>Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>.<br/><br/>If you did not request a login to [Application Name], please ignore this email."); // TODO(template): Update email body

                _logger.LogInformation($"Register | User created a new account with password.");
                
                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Account.Register | Error registering user: {registerRequestDto.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        /// <summary>
        /// Validates a user's credentials and, if 2FA isn't required, issues a JWT.
        /// </summary>
        /// <param name="userForAuthentication">The email/password to authenticate.</param>
        /// <returns>
        /// <see cref="AuthResponseDto"/> with a <c>Token</c> if authentication
        /// succeeded outright; with <c>RequiresTwoFactor = true</c> (and no token)
        /// if the credentials were valid but a second factor is still needed; or
        /// 401 for invalid credentials. Deliberately returns 200 with
        /// <c>IsAuthSuccessful = false</c>, rather than 404, when the email
        /// doesn't exist, so the response doesn't reveal account existence.
        /// </returns>
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
                        User = new ApplicationUserDto(user)
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

        /// <summary>
        /// Completes login for a user whose password was already validated but who
        /// still needs to supply a second factor (email, SMS, or authenticator code).
        /// </summary>
        /// <param name="request">The user's email, 2FA provider, and submitted code.</param>
        /// <returns>
        /// <see cref="AuthResponseDto"/> with a <c>Token</c> if the code verified,
        /// or <c>IsAuthSuccessful = false</c> with an error message otherwise.
        /// </returns>
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

                var claims = _jwtHandler.GetClaims(user);
                var tokenOptions = _jwtHandler.GenerateTokenOptions(signingCredentials, claims);
                var token = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

                return Ok(new AuthResponseDto
                {
                    IsAuthSuccessful = true,
                    Token = token,
                    RequiresTwoFactor = true,
                    User = new ApplicationUserDto(user)
                });
                
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error logging in user: {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }
        
        /// <summary>
        /// Generates and delivers a 2FA code via email or SMS. Not valid for the
        /// authenticator app method, since those codes are generated client-side.
        /// </summary>
        /// <param name="request">The target user's email, delivery method, and phone number (if SMS).</param>
        /// <returns><see cref="ResponseDto"/> indicating whether a code was sent.</returns>
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
                            "[Application Name] 2FA Code", // TODO(template): Update email subject
                            $"Your 2FA code is: {code}<br/><br/>This code is valid for {VerificationCodeExpiryMinutes} minutes.<br/><br/>If you did not request a 2FA code please ignore this email.");
                        break;
                    case "Phone":
                        // Use user phone number if 2fa is already enabled
                        var phoneNumber = user.TwoFactorEnabled ? user.PhoneNumber : request.PhoneNumber;
                        if (string.IsNullOrEmpty(phoneNumber))
                        {
                            return Ok(new ResponseDto { IsSuccess = false });
                        }
                        _logger.LogDebug($"SendTwoFaCode | Sending 2FA code to {phoneNumber}");

                        await _smsSender.SendSmsAsync(phoneNumber, $"Your 2FA code for [Application Name] is: {code}. This code is valid for {VerificationCodeExpiryMinutes} minutes. DO NOT share it with anyone."); // TODO(template): Update SMS message
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

        /// <summary>Emails a password reset link for a confirmed account.</summary>
        /// <param name="forgotPasswordDto">The email address requesting a reset.</param>
        /// <returns>
        /// <see cref="ResponseDto"/> with <c>IsSuccess = true</c> if an email was
        /// sent. Deliberately reports success the same way when the account
        /// doesn't exist or isn't confirmed, so the response doesn't reveal
        /// account existence.
        /// </returns>
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

                var callbackUrl = $"{Request.Scheme}://{Request.Host}/forgot-password/reset";
                callbackUrl = $"{callbackUrl}?code={code}";

                await _emailSender.SendEmailAsync(
                    forgotPasswordDto.Email,
                    "[Application Name] Password Reset", // TODO(template): Update email subject
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

        /// <summary>
        /// Sets a new password using the reset code emailed by <see cref="ForgotPassword"/>.
        /// </summary>
        /// <param name="request">The user's email, reset code, and new password.</param>
        /// <returns><see cref="ResponseDto"/> indicating whether the reset succeeded.</returns>
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
                    IsSuccess = result.Succeeded,
                    Message = result.Succeeded ? null : string.Join(" ", result.Errors.Select(e => e.Description))
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

        /// <summary>Changes a signed-in user's password given their current password.</summary>
        /// <param name="request">The user's email, current password, and new password.</param>
        /// <returns><see cref="ResponseDto"/> indicating whether the change succeeded.</returns>
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
                    var errorMessage = string.Join(" ", changePasswordResult.Errors.Select(e => e.Description));

                    foreach (var error in changePasswordResult.Errors)
                    {
                        _logger.LogError($"Error adding password: {error.Description}");
                    }

                    return Ok(new ResponseDto { IsSuccess = false, Message = errorMessage });
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
        

        /// <summary>
        /// Resends the email confirmation link for a user. If the user hasn't set
        /// a password yet (e.g. an admin-created account), the link also carries a
        /// password reset code so they can set one during confirmation.
        /// </summary>
        /// <param name="request">The target user's email.</param>
        /// <returns><see cref="ResponseDto"/> indicating whether an email was sent.</returns>
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

                var callbackUrl = $"{Request.Scheme}://{Request.Host}/email-confirmation";

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
                    "[Application Name] Email Confirmation", // TODO(template): Update email subject
                    $"In order to start using [Application Name], you need to verify your email.<br/><br/>Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>.<br/><br/>If you did not request a login to [Application Name], please ignore this email."); // TODO(template): Update email body

                _logger.LogInformation($"Email confirmation sent to {request.Email}");

                return Ok(new ResponseDto { IsSuccess = true });
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error sending email confirmation to {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }

        }

        /// <summary>Confirms a user's email using the code from the confirmation link.</summary>
        /// <param name="request">The user's ID and confirmation code.</param>
        /// <returns><see cref="ResponseDto"/> indicating whether confirmation succeeded.</returns>
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

        /// <summary>
        /// Generates (or reuses) an authenticator app key for a user and returns it
        /// as both a formatted shared key and a QR-code <c>otpauth://</c> URI, so the
        /// client can render a QR code for the user to scan.
        /// </summary>
        /// <param name="request">The target user's email.</param>
        /// <returns>
        /// <see cref="EnableAuthenticatorResponseDto"/> with the shared key and
        /// authenticator URI, or <see cref="ResponseDto"/> with <c>IsSuccess = false</c>
        /// if the user doesn't exist.
        /// </returns>
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
                

        /// <summary>
        /// Verifies a 2FA code and, on success, enables 2FA for the user with the
        /// given method. For the authenticator app method, also issues a fresh set
        /// of recovery codes.
        /// </summary>
        /// <param name="request">The user's email, 2FA method, submitted code, and phone number (if SMS).</param>
        /// <returns>
        /// <see cref="VerifyAuthenticatorResponseDto"/> with <c>IsVerified</c> and,
        /// for the authenticator method, the new recovery codes.
        /// </returns>
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
                    var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
                    response.Codes = recoveryCodes?.ToArray() ?? Array.Empty<string>();
                }

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error verifying 2FA for {request.Email}");
                return StatusCode(StatusCodes.Status500InternalServerError, e.Message);
            }
        }

        /// <summary>
        /// Disables 2FA and clears the authenticator key for a user, requiring them
        /// to set up a new authenticator from scratch. Allowed for the user acting
        /// on their own account, or an admin acting on another user's account.
        /// </summary>
        /// <param name="request">The target user's email.</param>
        /// <returns>
        /// <see cref="ResponseDto"/> on success; 404 if the user doesn't exist; 400
        /// if the caller is neither the target user nor an admin.
        /// </returns>
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

                // Get calling user to authorize the request and track who performed it
                var currentUser = GetCurrentUser();

                var isSelf = currentUser != null && currentUser.Id == user.Id;
                var isAdmin = currentUser != null && await _userManager.IsInRoleAsync(currentUser, "Admin");

                if (!isSelf && !isAdmin)
                {
                    return BadRequest("You can only reset your own authenticator. Resetting another account's authenticator requires the Admin role.");
                }

                await _userManager.SetTwoFactorEnabledAsync(user, false);
                await _userManager.ResetAuthenticatorKeyAsync(user);

                // Set 2fa method on user to null
                user.TwoFactorMethod = "";
                await _userManager.UpdateAsync(user);

                _logger.LogInformation(
                    $"Authentication app key for user with ID '{user.Id}' has been reset by '{currentUser!.Id}'");

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

        /// <summary>
        /// Maps a client-facing 2FA method name to the Identity token provider name.
        /// "Phone" and "Sms" are aliases for the same "Phone" provider.
        /// </summary>
        /// <param name="method">The client-supplied method: "Authenticator", "Email", "Phone", or "Sms".</param>
        /// <returns>The Identity token provider name, or an empty string if <paramref name="method"/> is unrecognized.</returns>
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


        /// <summary>Gets the user's authenticator key, generating one first if none exists.</summary>
        private async Task<string> GetUnformattedKey(ApplicationUser user)
        {
            // Load the authenticator key & QR code URI to display on the form
            var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(unformattedKey))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            }

            return unformattedKey
                ?? throw new InvalidOperationException($"Failed to generate an authenticator key for user '{user.Id}'.");
        }

        /// <summary>Gets the user's authenticator key formatted for display (space-separated, lowercase).</summary>
        private async Task<string> GetSharedKey(ApplicationUser user)
        {
            var unformattedKey = await GetUnformattedKey(user);
            var formattedKey = FormatKey(unformattedKey);

            return formattedKey;

        }

        /// <summary>Builds the <c>otpauth://</c> QR-code URI for a user's authenticator key.</summary>
        private async Task<string> GetAuthenticatorUri(ApplicationUser user)
        {
            var unformattedKey = await GetUnformattedKey(user);
            var email = await _userManager.GetEmailAsync(user);
            var authenticatorUri = GenerateQrCodeUri(email!, unformattedKey);

            return authenticatorUri;
        }                

        /// <summary>Splits an authenticator key into space-separated 4-character groups, lowercased for readability.</summary>
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

        /// <summary>Formats the authenticator key into an <c>otpauth://totp/...</c> QR-code URI.</summary>
        private string GenerateQrCodeUri(string email, string unformattedKey)
        {
            return string.Format(
                CultureInfo.InvariantCulture,
                AuthenticatorUriFormat,
                _urlEncoder.Encode("AngularDotNetAuthTemplate.Api"), // TODO(template): Change to your app's name
                _urlEncoder.Encode(email),
                unformattedKey);
        }


        /// <summary>A minimal authenticated endpoint the client uses to smoke-test that a bearer token is still valid.</summary>
        [HttpGet]
        [Route("secure")]
        [Authorize]
        public IActionResult Secure()
        {
            return Ok("Got it!");
        }
               

    }
}
