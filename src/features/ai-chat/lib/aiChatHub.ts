import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from "@microsoft/signalr";
import { env } from "@/lib/env";
import { loadTokens } from "@/lib/api";

const HUB_PATH = "/hubs/ai-chat";

let connection: HubConnection | null = null;
let starting: Promise<void> | null = null;

function hubUrl(): string {
  return `${new URL(env.apiBase).origin}${HUB_PATH}`;
}

export async function getAiChatConnection(): Promise<HubConnection> {
  connection ??= new HubConnectionBuilder()
    .withUrl(hubUrl(), { accessTokenFactory: () => loadTokens()?.accessToken ?? "" })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  if (connection.state === HubConnectionState.Disconnected) {
    starting ??= connection.start().finally(() => {
      starting = null;
    });
  }
  if (starting) await starting;
  return connection;
}

export async function closeAiChatConnection() {
  const current = connection;
  connection = null;
  starting = null;
  await current?.stop();
}
