using Microsoft.EntityFrameworkCore;
using AngularDotNetAuthTemplate.Api.ExtensionMethods;
using System.Linq.Expressions;

namespace AngularDotNetAuthTemplate.Api.Data
{
    public class Repository<T> : IRepository<T> where T : class, IEntity
    {
        protected readonly ILogger<Repository<T>> Logger;

        protected readonly ApplicationDbContext Context;
        protected readonly DbSet<T> Entities;

        public Repository(ILogger<Repository<T>> logger, ApplicationDbContext context)
        {
            Logger = logger;
            Context = context;
            Entities = Context.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAsync()
        {
            try
            {
                Logger.LogDebug($"Repository - GetAsync");
                var results = await Entities.ToListAsync();
                Logger.LogTrace($"Repository - GetAsync - Results: {results.ToJson()}");
                return results;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - GetAsync");
                throw;
            }
        }

        public async Task<T> GetAsync(string id)
        {
            try
            {
                Logger.LogDebug($"Repository - GetAsync - Id: {id}");
                var result = await Entities.FirstOrDefaultAsync(e => e.Id == id);
                Logger.LogTrace($"Repository - GetAsync - Result: {result?.ToJson()}");
                
                // TODO: What to return if no result is found
                return result; 
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - GetAsync");
                throw;
            }
        }

        public async Task<T> FindByConditionAsync(Expression<Func<T, bool>> expression)
        {
            try
            {
                Logger.LogDebug($"Repository - FindByConditionAsync - Expression: {expression}");
                var result = await Entities.FirstOrDefaultAsync(expression);
                Logger.LogTrace($"Repository - FindByConditionAsync - Result: {result?.ToJson()}");
                return result;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - FindByConditionAsync");
                throw;
            }
        }

        public async Task<IEnumerable<T>> WhereAsync(Expression<Func<T, bool>> expression)
        {
            try
            {
                Logger.LogDebug($"Repository - WhereAsync - Expression: {expression}");
                var results = await Entities.Where(expression).ToListAsync();
                Logger.LogTrace($"Repository - WhereAsync - Results: {results.ToJson()}");
                return results;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - WhereAsync");
                throw;
            }
        }

        public async Task<T> InsertAsync(T entity)
        {
            try
            {
                Logger.LogDebug($"Repository - InsertAsync - Entity: {entity.ToJson()}");
                await Entities.AddAsync(entity);
                await Context.SaveChangesAsync();
                Logger.LogTrace($"Repository - InsertAsync - Entity: {entity.ToJson()}");
                return entity;
            }
            // TODO: Handle validation exceptions
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - InsertAsync");
                throw;
            }
        }

        public async Task<T> UpdateAsync(T entity)
        {
            try
            {
                Logger.LogDebug($"Repository - UpdateAsync - Entity: {entity.ToJson()}");
                Entities.Update(entity);
                await Context.SaveChangesAsync();
                Logger.LogTrace($"Repository - UpdateAsync - Entity: {entity.ToJson()}");
                return entity;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - UpdateAsync");
                throw;
            }
        }

        public virtual async Task DeleteAsync(string id)
        {
            try
            {
                Logger.LogDebug($"Repository - DeleteAsync - Id: {id}");
                var entity = await Entities.FirstOrDefaultAsync(e => e.Id == id);
                if (entity == null)
                {
                    Logger.LogTrace($"Repository - DeleteAsync - Entity not found for Id: {id}");
                    return;
                }
                Entities.Remove(entity);
                await Context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "An error occurred in Repository - DeleteAsync");
                throw;
            }
        }

        private bool _disposed;

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    Context?.Dispose();
                }
            }
            _disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

    }
}
