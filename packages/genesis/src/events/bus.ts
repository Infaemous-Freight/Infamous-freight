type Handler = (payload: unknown) => void;

export class EventBus {
  private handlers = new Map<string, Handler[]>();

  on(event: string, handler: Handler) {
    const arr = this.handlers.get(event) ?? [];
    arr.push(handler);
    this.handlers.set(event, arr);
    return () => this.handlers.set(event, (this.handlers.get(event) ?? []).filter((h) => h !== handler));
  }

  emit(evt: { type: string; payload: unknown }) {
    for (const h of this.handlers.get(evt.type) ?? []) h(evt.payload);
  }
}
