namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Admin
{
    /// <summary>
    /// Request for the admin user-update endpoint. Covers only the app-specific profile
    /// fields this app owns directly - email and role membership are delegated to
    /// DGates.Identity.Jwt2Fa's <c>AdminUpdateUserAsync</c>, not duplicated here.
    /// </summary>
    public class UpdateUserRequestDto
    {
        /// <summary>The id of the user to update.</summary>
        public required string Id { get; set; }
        /// <summary>The user's first name.</summary>
        public string? FirstName { get; set; }
        /// <summary>The user's last name.</summary>
        public string? LastName { get; set; }
        /// <summary>The user's phone number.</summary>
        public string? PhoneNumber { get; set; }
        /// <summary>The user's street address.</summary>
        public string? StreetAddress { get; set; }
        /// <summary>The user's city.</summary>
        public string? City { get; set; }
        /// <summary>The user's zip/postal code.</summary>
        public string? ZipCode { get; set; }
        /// <summary>The user's state.</summary>
        public string? State { get; set; }
        /// <summary>The user's complete role membership after this update - not a delta.</summary>
        public List<string> Roles { get; set; } = new();
    }
}
