import { Stateful, State, StatefulSignatures } from "./Stateful";

export class Context<L extends State = State> extends Stateful<
  L,
  StatefulSignatures
> {
  // methods used by Persistor

  persist(): any {
    const value = this.state;

    return value;
  }

  hydrate(value: any): void {
    this.state = value;
  }

  // override Stateful methods

  protected async queueUpdate(): Promise<void> {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => {
      this.startUpdate();
    });

    return await super.queueUpdate();
  }

  protected startUpdate(): void {
    super.startUpdate();

    this.triggerUpdate();
  }
}
