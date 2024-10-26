using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using AngularAndDotNetCoreAuthTemplate.Models.Options;
using System.Net;
using AngularAndDotNetCoreAuthTemplate.ExtensionMethods;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace AngularAndDotNetCoreAuthTemplate.Services
{
    public class SendGridEmailSender : IEmailSender
    {

        private readonly ILogger _logger;

        private bool IsOverrideRecipient => !string.IsNullOrEmpty(_options.Value.OverrideRecipient);
        private string OverrideRecipient => _options.Value.OverrideRecipient;

        readonly IOptions<SendGridEmailOptions> _options;


        public SendGridEmailSender(ILogger<SmtpEmailSender> logger, IOptions<SendGridEmailOptions> options)
        {
            _logger = logger;
            _options = options;

        }


        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            _logger.LogDebug($"SendMailAsync | toEmail: {toEmail} | subject: {subject} | message: {message}");
            _logger.LogDebug($"options: {_options.ToJson()}");

            
            var apiKey = _options.Value.ApiKey;
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(_options.Value.FromAddress, _options.Value.FromName);

            var testSubject = IsOverrideRecipient ? $" - Original Recipient: {toEmail}" : "";
            var finalSubject = $"{subject}{testSubject}";

            var finalRecipient = IsOverrideRecipient ? OverrideRecipient : toEmail;

            var to = new EmailAddress(finalRecipient);
            var msg = MailHelper.CreateSingleEmail(from, to, finalSubject, "", message);
            var response = await client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"Message sent to {finalRecipient}");
            }
            else
            {
                _logger.LogError($"Error sending message to {finalRecipient}");
            }                        

        }

    }
}
