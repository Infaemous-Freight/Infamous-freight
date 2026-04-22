export interface AppConfig {
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const rawPort = env.PORT ?? '3000';
  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return {
    port: parsedPort,
  };
}
