namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class AuthResponseDto
    {
        public bool IsAuthSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Token { get; set; }
        public bool RequiresTwoFactor { get; set; }
        public ApplicationUser User { get; set; }

    }

    //public class UserForAuthDto
    //{
    //    public string Email { get; set; }
    //    public string Name { get; set; }
    //    public bool IsAdmin { get; set; }
    //}
}
