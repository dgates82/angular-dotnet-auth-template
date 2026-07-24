using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AngularDotNetAuthTemplate.Api.ExtensionMethods;
using AngularDotNetAuthTemplate.Api.Models.Options;
using System.Net;
using System.Net.Mail;

namespace AngularDotNetAuthTemplate.Api.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly ILogger _logger;

        private bool IsOverrideRecipient => !string.IsNullOrEmpty(_options.Value.OverrideRecipient);
        private string OverrideRecipient => _options.Value.OverrideRecipient;

        readonly IOptions<SmtpEmailOptions> _options;

                
        public SmtpEmailSender(ILogger<SmtpEmailSender> logger, IOptions<SmtpEmailOptions> options)
        {            
            _logger = logger;
            _options = options;

        }


        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            _logger.LogDebug($"SendMailAsync | toEmail: {toEmail} | subject: {subject} | message: {message}");
            _logger.LogDebug($"options: {_options.ToJson()}");

            var msg = new MailMessage();
            msg.From = new MailAddress(_options.Value.FromAddress);

            var testSubject = IsOverrideRecipient ? $" - Original Recipient: {toEmail}" : "";
            var finalSubject = $"{subject}{testSubject}";
            msg.Subject = finalSubject;
            msg.Body = message;

            var finalRecipient = IsOverrideRecipient ? OverrideRecipient : toEmail;

            msg.To.Add(finalRecipient);

            msg.IsBodyHtml = true;

            using var smtpClient = new SmtpClient
            {
                UseDefaultCredentials = string.IsNullOrEmpty(_options.Value.UserName),
                EnableSsl = _options.Value.EnableSsl,
                Host = _options.Value.Host,
                Port = int.Parse(_options.Value.Port)                
            };

            if (!string.IsNullOrEmpty(_options.Value.UserName)) 
            {
                smtpClient.Credentials = new NetworkCredential(_options.Value.UserName, _options.Value.Password);
            }

            await smtpClient.SendMailAsync(msg);

            _logger.LogInformation($"Message sent to {finalRecipient}");

        }       

    }
}
