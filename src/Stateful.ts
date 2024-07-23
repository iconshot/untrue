import { Comparer } from "./Comparer";
import { Emitter } from "./Emitter";

export interface State {}

type Resolve = (value: unknown) => void;

export class Stateful<L extends State> extends Emitter {
  protected state: L;

  protected prevState: L | null = null;
  protected nextState: L | null = null;

  protected updateTimeout: number | undefined;

  protected updateResolvers: Resolve[] = [];

  getState(): L {
    return this.state;
  }

  protected triggerUpdate() {
    this.emit("update");
  }

  protected async update() {
    return await this.queueUpdate();
  }

  protected async updateState(state: Partial<L>) {
    let currentState = { ...this.state };

    if (this.nextState !== null) {
      currentState = { ...currentState, ...this.nextState };
    }

    let tmpState = { ...currentState, ...state };

    if (this.nextState === null) {
      const equal = Comparer.compare(tmpState, currentState);

      if (equal) {
        return;
      }
    }

    this.nextState = tmpState;

    return await this.queueUpdate();
  }

  protected queueUpdate() {
    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  protected startUpdate() {
    this.replaceUpdate();
    this.resolveUpdate();
  }

  protected replaceUpdate() {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  protected resolveUpdate() {
    this.updateResolvers.forEach((resolve) => resolve(undefined));

    this.updateResolvers = [];
  }
}
