import { Comparer } from "./Comparer";
import { Emitter } from "./Emitter";

export interface State {}

type Resolve = (value: unknown) => void;

export class Stateful<L extends State> extends Emitter {
  state: L;

  prevState: L | null = null;
  nextState: L | null = null;

  updateTimeout: number | undefined;

  updateResolvers: Resolve[] = [];

  getState() {
    return this.state;
  }

  triggerUpdate() {
    this.emit("update");
  }

  async update() {
    return await this.queueUpdate();
  }

  async updateState(state: Partial<L>) {
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

  queueUpdate() {
    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  startUpdate() {
    this.replaceUpdate();
    this.resolveUpdate();
  }

  replaceUpdate() {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  resolveUpdate() {
    this.updateResolvers.forEach((resolve) => resolve(undefined));

    this.updateResolvers = [];
  }
}
