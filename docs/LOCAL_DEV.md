# Local Development

TODO(template): expand this with anything not already covered in the root
README's [Running the Template As-Is](../README.md#running-the-template-as-is)
section — e.g. IDE run configurations, seeding data, or troubleshooting notes
specific to your machine setup.

## Ports

Native `dotnet run` uses `https://localhost:7249` (the dev cert port from
`launchSettings.json`); Docker uses `http://localhost:8080` (the .NET base
image default). Not unified yet — just be aware they're different if you're
switching between the two.
