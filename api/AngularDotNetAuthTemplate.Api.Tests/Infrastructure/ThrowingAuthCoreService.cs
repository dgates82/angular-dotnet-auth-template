using System.Security.Claims;
using AngularDotNetAuthTemplate.Api.Models;
using DGates.Identity.Jwt2Fa.Dtos;
using DGates.Identity.Jwt2Fa.Services;

namespace AngularDotNetAuthTemplate.Api.Tests.Infrastructure;

// Only AdminUpdateUserAsync is exercised by tests that need a failing IAuthCoreService -
// every other member throws NotImplementedException so a test fails loudly if it ends up
// exercising a path this fake wasn't built for.
internal class ThrowingAuthCoreService : IAuthCoreService<ApplicationUser>
{
    public Task<Jwt2FaResult<ResponseDto>> RegisterAsync(RegisterRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<AuthResponseDto>> LoginAsync(AuthRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<ResponseDto>> ForgotPasswordAsync(ForgotPasswordDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<ResponseDto>> ResetPasswordAsync(ResetPasswordRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<ResponseDto>> ChangePasswordAsync(ChangePasswordRequestDto request, ClaimsPrincipal caller) => throw new NotImplementedException();

    public Task<Jwt2FaResult<ResponseDto>> SendEmailConfirmationAsync(SendEmailConfirmationRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<ResponseDto>> ConfirmEmailAsync(ConfirmEmailRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<object>> GetUserByEmailAsync(string email, ClaimsPrincipal caller) => throw new NotImplementedException();

    public Task<Jwt2FaResult<object>> GetUserByIdAsync(string id) => throw new NotImplementedException();

    public Task<Jwt2FaResult<PagedResultDto<object>>> ListUsersAsync(int page, int pageSize) => throw new NotImplementedException();

    public Task<Jwt2FaResult<object>> AdminCreateUserAsync(AdminCreateUserRequestDto request) => throw new NotImplementedException();

    public Task<Jwt2FaResult<object>> AdminUpdateUserAsync(string id, AdminUpdateUserRequestDto request) =>
        throw new InvalidOperationException("Simulated failure for testing.");

    public Task<Jwt2FaResult<ResponseDto>> AdminUnlockUserAsync(string id) => throw new NotImplementedException();
}
