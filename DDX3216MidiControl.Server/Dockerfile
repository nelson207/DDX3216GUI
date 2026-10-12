# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# The MIDI backend talks to the ALSA sequencer (libasound2). Run the container with access to the MIDI devices:
#   docker run --device /dev/snd --group-add audio -p 8080:8080 -v ddx-data:/app/App_Data <image>
RUN apt-get update \
    && apt-get install -y --no-install-recommends libasound2 \
    && rm -rf /var/lib/apt/lists/*
USER $APP_UID
WORKDIR /app
EXPOSE 8080


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS with-node
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get -y install nodejs


FROM with-node AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["DDX3216MidiControl.Server/DDX3216MidiControl.Server.csproj", "DDX3216MidiControl.Server/"]
COPY ["ddx3216midicontrol.client/ddx3216midicontrol.client.esproj", "ddx3216midicontrol.client/"]
RUN dotnet restore "./DDX3216MidiControl.Server/DDX3216MidiControl.Server.csproj"
COPY . .
WORKDIR "/src/DDX3216MidiControl.Server"
RUN dotnet build "./DDX3216MidiControl.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DDX3216MidiControl.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DDX3216MidiControl.Server.dll"]
