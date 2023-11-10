using AngularAndDotNetCoreAuthTemplate.Models;

namespace AngularAndDotNetCoreAuthTemplate.Data
{
    public class ApplicationUserRepository : Repository<ApplicationUser>
    {
        public ApplicationUserRepository(ILogger<ApplicationUserRepository> logger, ApplicationDbContext context) 
            : base(logger, context)
        {
        }

        public async Task SetHasSetPassword(string id, bool hasSetPassword)
        {
            Logger.LogDebug($"Repository - SetHasSetPassword - Id: {id} - HasSetPassword: {hasSetPassword}");
            try
            {
                var user = await GetAsync(id);
                user.HasSetPassword = hasSetPassword;
                await UpdateAsync(user);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - UpdateAsync");
                throw;
            }

        }

        public override Task DeleteAsync(string id)
        {
            // Application users should not be deleted
            throw new NotSupportedException();
        }

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
