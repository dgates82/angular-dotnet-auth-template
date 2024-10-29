namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account;

public class SendVerificationCodeRequestDto
{
    public string Email { get; set; }
    public string Method { get; set; }
    
}