namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class TwoFaAuthRequestDto
    {
        public string Email { get; set; }
        public string TwoFactorProvider { get; set; }
        public string TwoFactorCode { get; set; }
    }
}
