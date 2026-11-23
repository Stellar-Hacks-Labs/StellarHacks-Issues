export class HackathonPage {
  constructor(private readonly path: string) {}
  url(base: string): string { return `${base}${this.path}`; }
}
