export class JudgePage {
  constructor(private readonly contract: string) {}
  url(base: string): string { return `${base}/judge/${this.contract}`; }
}
