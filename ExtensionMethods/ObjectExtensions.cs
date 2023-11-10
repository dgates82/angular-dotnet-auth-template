using Newtonsoft.Json;

namespace AngularAndDotNetCoreAuthTemplate.ExtensionMethods
{
    public static class ObjectExtensions
    {
        public static string ToJson(this object value)
        {
            return ToJson(value, PreserveReferencesHandling.Objects);
        }

        public static string ToJson(this object value, PreserveReferencesHandling referencesHandling)
        {
            try
            {
                var settings = new JsonSerializerSettings
                {
                    PreserveReferencesHandling = referencesHandling,
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                };

                return JsonConvert.SerializeObject(value, Formatting.Indented, settings);
            }
            catch (Exception)
            {
                return "";
            }
        }

    }
}