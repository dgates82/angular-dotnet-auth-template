namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;

public class SendVerificationCodeRequestDto
{
    public string Email { get; set; }
    public string PhoneNumber { get; set; } = "";
    public string Method { get; set; }
    
}