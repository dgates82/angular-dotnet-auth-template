using AngularDotNetAuthTemplate.Api.Models;

namespace AngularDotNetAuthTemplate.Api.Data
{
    /// <summary>
    /// <see cref="ApplicationUser"/>-specific repository, adding activation and
    /// password-state operations on top of the generic <see cref="Repository{T}"/>
    /// CRUD methods. Deletion is disabled — user accounts are deactivated, not removed.
    /// </summary>
    public class ApplicationUserRepository : Repository<ApplicationUser>
    {
        /// <summary>Creates the repository with its injected logger and database context.</summary>
        public ApplicationUserRepository(ILogger<ApplicationUserRepository> logger, ApplicationDbContext context)
            : base(logger, context)
        {
        }

        /// <summary>Sets whether the user has completed their initial password setup, and saves the change.</summary>
        public async Task SetHasSetPassword(ApplicationUser user, bool hasSetPassword)
        {
            Logger.LogDebug($"Repository - SetHasSetPassword - user.Id: {user.Id} - HasSetPassword: {hasSetPassword}");
            try
            {
                // var user = await GetAsync(id);
                user.HasSetPassword = hasSetPassword;
                await UpdateAsync(user);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - UpdateAsync");
                throw;
            }

        }

        /// <summary>Always throws — application users are deactivated, not deleted.</summary>
        /// <exception cref="NotSupportedException">Always thrown.</exception>
        public override Task DeleteAsync(string id)
        {
            // Application users should not be deleted
            throw new NotSupportedException();
        }

        /// <summary>Deactivates a user, preventing further login, and records who made the change.</summary>
        public async Task DeactivateAsync(string id, string updateUserId)
        {
            Logger.LogDebug($"Repository - DeactivateAsync - Id: {id}");

            try
            {
                var user = await GetAsync(id);
                user.IsActive = false;
                user.UpdatedById = updateUserId;
                user.UpdatedAt = DateTime.Now;
                await UpdateAsync(user);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - DeactivateAsync");
                throw;
            }

        }

        /// <summary>Reactivates a previously deactivated user, and records who made the change.</summary>
        public async Task ActivateAsync(string id, string updateUserId)
        {
            Logger.LogDebug($"Repository - ActivateAsync - Id: {id}");

            try
            {
                var user = await GetAsync(id);
                user.IsActive = true;
                user.UpdatedById = updateUserId;
                user.UpdatedAt = DateTime.Now;
                await UpdateAsync(user);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - ActivateAsync");
                throw;
            }
        }

    }
}
