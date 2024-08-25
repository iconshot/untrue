import { Stateful, State, StatefulSignatures } from "./Stateful";

export class Context<L extends State = State> extends Stateful<
  L,
  StatefulSignatures
> {
  constructor() {
    super();

    queueMicrotask((): void => {
      this.init();
    });
  }

  // methods used by Persistor

  public persist(): any {
    const value = this.state;

    return value;
  }

  public hydrate(value: any): void {
    this.state = value;
  }

  // override Stateful methods

  protected startUpdate(): void {
    this.performUpdate();
  }

  protected performUpdate(): void {
    super.performUpdate();

    this.triggerUpdate();
  }
}
