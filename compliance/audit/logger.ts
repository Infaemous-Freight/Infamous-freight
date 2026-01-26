export function logAction(
  actor: string,
  action: string,
  metadata: Record<string, any>,
) {
  console.log(
    JSON.stringify({ actor, action, metadata, timestamp: new Date() })
  );
}
