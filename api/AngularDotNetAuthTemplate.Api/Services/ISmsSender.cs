namespace AngularDotNetAuthTemplate.Api.Services;

public interface ISmsSender
{
    public Task SendSmsAsync(string number, string message);
}