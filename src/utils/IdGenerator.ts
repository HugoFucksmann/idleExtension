export class IdGenerator {
  static generate(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
