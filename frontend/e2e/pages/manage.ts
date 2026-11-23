export class ManagePage {
  constructor(private readonly contract: string) {}
  url(base: string): string { return `${base}/manage/${this.contract}`; }
}
