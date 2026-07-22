using System.Text.Json;
using AngularDotNetAuthTemplate.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AngularDotNetAuthTemplate.Api.Controllers;

public class CustomControllerBase : ControllerBase
{
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