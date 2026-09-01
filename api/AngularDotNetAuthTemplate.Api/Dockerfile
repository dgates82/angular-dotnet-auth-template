#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.
# Build context is the repo root: docker build -f api/AngularDotNetAuthTemplate.Api/Dockerfile .

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM node:20-alpine AS client-build
WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["api/AngularDotNetAuthTemplate.Api/AngularDotNetAuthTemplate.Api.csproj", "api/AngularDotNetAuthTemplate.Api/"]
RUN dotnet restore "api/AngularDotNetAuthTemplate.Api/AngularDotNetAuthTemplate.Api.csproj"
COPY api/AngularDotNetAuthTemplate.Api/ api/AngularDotNetAuthTemplate.Api/
WORKDIR "/src/api/AngularDotNetAuthTemplate.Api"
RUN dotnet build "AngularDotNetAuthTemplate.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AngularDotNetAuthTemplate.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
# Mirrors the repo's api/<project>/ and client/ sibling layout so Program.cs's
# relative WebRootPath ("../../client/dist/browser") resolves the same way
# in the container as it does when running the project directly from source.
WORKDIR /app/api/AngularDotNetAuthTemplate.Api
COPY --from=publish /app/publish .
COPY --from=client-build /src/client/dist/browser /app/client/dist/browser

# Baked in at build time rather than a runtime config - see issues #117, #118.
ARG DEMO_BANNER_ENABLED=false
ARG DEMO_BANNER_REPO_URL=""
ARG VERSION=""
RUN printf '{"demoBannerEnabled":%s,"demoBannerRepoUrl":"%s","version":"%s"}' \
    "${DEMO_BANNER_ENABLED}" "${DEMO_BANNER_REPO_URL}" "${VERSION}" \
    > /app/client/dist/browser/app-info.json

ENTRYPOINT ["dotnet", "AngularDotNetAuthTemplate.Api.dll"]
