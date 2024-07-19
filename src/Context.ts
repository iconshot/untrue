import { Stateful, State } from "./Stateful";

export class Context<L extends State> extends Stateful<L> {
  // methods used by Persistor

  persist(): any {
    const value = this.state;

    return value;
  }

  hydrate(value: any) {
    this.state = value;
  }

  // override Stateful methods

  async queueUpdate() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.startUpdate());

    return await super.queueUpdate();
  }

  startUpdate() {
    super.startUpdate();

    this.triggerUpdate();
  }
}
