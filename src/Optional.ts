export class Optional<Data> {
  private readonly value: Data | undefined;

  constructor(value?: Data) {
    this.value = value;
  }

  public isPresent(): boolean {
    return this.value !== undefined;
  }

  public get(): Data {
    if (!this.isPresent()) {
      throw new Error("No value present");
    }

    return this.value!;
  }
}