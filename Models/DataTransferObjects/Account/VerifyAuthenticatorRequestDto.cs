namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class VerifyAuthenticatorRequestDto
    {
        public string Email { get; set; }
        public string Code { get; set; }
    }
}
