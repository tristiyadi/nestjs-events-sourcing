export class TimeUtil {
  static now(): Date {
    return new Date();
  }

  static dateISOString(date: Date): string {
    return date.toISOString();
  }

  static toISOString(): string {
    return new Date().toISOString();
  }
}
