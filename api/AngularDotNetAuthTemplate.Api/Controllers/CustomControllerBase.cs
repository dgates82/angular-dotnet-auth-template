using System.Text.Json;
using AngularDotNetAuthTemplate.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AngularDotNetAuthTemplate.Api.Controllers;

/// <summary>
/// Base class for API controllers, providing shared helpers for reading the
/// authenticated user out of the current request's claims.
/// </summary>
public class CustomControllerBase : ControllerBase
{
    /// <summary>
    /// Deserializes the current request's "user" claim (populated at login,
    /// see <see cref="AngularDotNetAuthTemplate.Api.Services.JwtHandler"/>)
    /// back into an <see cref="ApplicationUser"/>.
    /// </summary>
    /// <returns>
    /// The authenticated user, or <c>null</c> if the request is unauthenticated
    /// or the claim is missing.
    /// </returns>
    protected virtual ApplicationUser? GetCurrentUser()
    {
        var user = User?.FindFirst("user")?.Value;
        if (user == null)
        {
            return null;
        }

        var result = JsonSerializer.Deserialize<ApplicationUser>(user);

        return result;
    }
    
}