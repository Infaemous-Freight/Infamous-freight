export function logAction(actor: string, action: string, metadata: unknown) {
  console.log(
    JSON.stringify({ actor, action, metadata, timestamp: new Date() })
  );
}
