namespace AngularDotNetAuthTemplate.Api.Models
{
    /// <summary>View model backing the default MVC error page.</summary>
    public class ErrorViewModel
    {
        /// <summary>The ASP.NET Core request id for the failed request, for correlating with logs.</summary>
        public string? RequestId { get; set; }

        /// <summary>Whether <see cref="RequestId"/> is set and should be displayed.</summary>
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}