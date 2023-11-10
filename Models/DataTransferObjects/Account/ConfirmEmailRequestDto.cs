namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class ConfirmEmailRequestDto
    {
        public string UserId { get; set; }
        public string Code { get; set; }
    }
}
