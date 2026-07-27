using System.Linq.Expressions;

namespace AngularDotNetAuthTemplate.Api.Data
{
    /// <summary>Generic CRUD data-access contract for an EF-backed entity type.</summary>
    public interface IRepository<T>: IDisposable where T : IEntity
    {
        /// <summary>Gets all entities.</summary>
        Task<IEnumerable<T>> GetAsync();

        /// <summary>Gets a single entity by ID, or <c>null</c> if not found.</summary>
        Task<T?> GetAsync(string id);

        /// <summary>Inserts a new entity and saves changes.</summary>
        Task<T> InsertAsync(T entity);

        /// <summary>Updates an existing entity and saves changes.</summary>
        Task<T> UpdateAsync(T entity);

        /// <summary>Deletes an entity by ID. No-ops if the entity doesn't exist.</summary>
        Task DeleteAsync(string id);

        /// <summary>Gets the first entity matching <paramref name="expression"/>, or <c>null</c> if none match.</summary>
        Task<T?> FindByConditionAsync(Expression<Func<T, bool>> expression);

        /// <summary>Gets all entities matching <paramref name="expression"/>.</summary>
        Task<IEnumerable<T>> WhereAsync(Expression<Func<T, bool>> expression);

    }
}
