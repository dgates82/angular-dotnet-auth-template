using AngularDotNetAuthTemplate.Api.ExtensionMethods;
using AngularDotNetAuthTemplate.Api.Models.Options;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using PostmarkDotNet;

namespace AngularDotNetAuthTemplate.Api.Services;

/// <summary>
/// Alternate <see cref="IEmailSender"/> implementation using Postmark. Not wired
/// up by default (see the commented registration in <c>Program.cs</c>); swap in
/// for <see cref="SmtpEmailSender"/> when a real transactional-email provider
/// is needed.
/// </summary>
public class PostMarkEmailSender : IEmailSender
{
    private readonly ILogger _logger;

    readonly IOptions<PostMarkEmailOptions> _options;

    private bool IsOverrideRecipient => !string.IsNullOrEmpty(_options.Value.OverrideRecipient);
    private string OverrideRecipient => _options.Value.OverrideRecipient;

    /// <summary>Creates the sender with its injected logger and Postmark configuration options.</summary>
    public PostMarkEmailSender(ILogger<SmtpEmailSender> logger, IOptions<PostMarkEmailOptions> options)
    {
        _logger = logger;
        _options = options;
    }

    /// <summary>
    /// Sends an HTML email via the Postmark API. If
    /// <see cref="PostMarkEmailOptions.OverrideRecipient"/> is configured, the
    /// email is redirected there instead, with the original recipient appended
    /// to the subject line.
    /// </summary>
    public async Task SendEmailAsync(string toEmail, string subject, string message)
    {
        _logger.LogDebug($"SendMailAsync | toEmail: {toEmail} | subject: {subject} | message: {message}");
        _logger.LogDebug($"options: {_options.ToJson()}");
        try
        {


            var client = new PostmarkClient(_options.Value.ApiKey);
            var from = _options.Value.FromAddress;

            var testSubject = IsOverrideRecipient ? $" - Original Recipient: {toEmail}" : "";
            var finalSubject = $"{subject}{testSubject}";

            var finalRecipient = IsOverrideRecipient ? OverrideRecipient : toEmail;

            var msg = new PostmarkMessage
            {
                From = from,
                To = finalRecipient,
                TrackOpens = true,
                Subject = finalSubject,
                HtmlBody = message
            };

            var response = await client.SendMessageAsync(msg);

            if (response.Status == PostmarkStatus.Success)
            {
                _logger.LogInformation($"Message sent to {finalRecipient}");
            }
            else
            {
                _logger.LogError($"Error sending message to {finalRecipient}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending email to {toEmail}");
        }
    }
}