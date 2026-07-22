namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    public class ForgotPasswordDto
    {
        public string Email { get; set; }
        public string? Token { get; set; }

    }
}
