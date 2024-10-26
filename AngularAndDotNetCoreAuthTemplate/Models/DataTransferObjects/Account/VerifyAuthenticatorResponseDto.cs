namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class VerifyAuthenticatorResponseDto
    {
        public bool IsVerified { get; set; }
        public string Message { get; set; }
        public string[] Codes { get; set; }
    }
}
