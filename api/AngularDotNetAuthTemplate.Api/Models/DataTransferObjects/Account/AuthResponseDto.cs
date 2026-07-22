namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    public class AuthResponseDto
    {
        public bool IsAuthSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Token { get; set; }
        public bool RequiresTwoFactor { get; set; }
        public string TwoFactorMethod { get; set; }
        public string PhoneNumber { get; set; }
        public ApplicationUser User { get; set; }

    }
   
}
