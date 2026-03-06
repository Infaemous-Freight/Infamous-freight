export class GenesisStore<T> {
  constructor(private state: T) {}
  get() { return this.state; }
  set(next: T) { this.state = next; }
}
