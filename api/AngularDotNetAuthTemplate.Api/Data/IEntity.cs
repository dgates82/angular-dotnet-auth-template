namespace AngularDotNetAuthTemplate.Api.Data
{
    /// <summary>Marks a type as an EF-backed entity with a string primary key, so it can be used with <see cref="Repository{T}"/>.</summary>
    public interface IEntity
    {
        /// <summary>The entity's primary key.</summary>
        string Id { get; set; }

    }
}
