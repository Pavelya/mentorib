export function getRuntimeEnvironment(): string {
  return process.env.NODE_ENV ?? "unknown";
}
