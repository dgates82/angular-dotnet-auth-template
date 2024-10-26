namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class EnableAuthenticatorResponseDto
    {
        public string SharedKey { get; set; }
        public string AuthenticatorUri { get; set; }
    }
}
