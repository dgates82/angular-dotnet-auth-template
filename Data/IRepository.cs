using System.Linq.Expressions;

namespace AngularAndDotNetCoreAuthTemplate.Data
{
    public interface IRepository<T>: IDisposable where T : IEntity
    {
        Task<IEnumerable<T>> GetAsync();
        Task<T> GetAsync(string id);
        Task<T> InsertAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(string id);
        Task<T> FindByConditionAsync(Expression<Func<T, bool>> expression);
        Task<IEnumerable<T>> WhereAsync(Expression<Func<T, bool>> expression);

    }
}
