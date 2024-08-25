import { Comparer } from "./Comparer";
import { Emitter } from "./Emitter";

export interface State {}

export type StatefulSignatures = {
  update: () => any;
};

type UpdateResolver = (value: void) => void;

export abstract class Stateful<
  L extends State,
  M extends StatefulSignatures
> extends Emitter<M> {
  protected state: L;

  protected prevState: L | null = null;
  protected nextState: L | null = null;

  protected updateTimeout: number | undefined;

  protected updateResolvers: UpdateResolver[] = [];

  public getState(): L {
    return this.state;
  }

  protected triggerUpdate(): void {
    const self = this as Stateful<L, StatefulSignatures>;

    self.emit("update");
  }

  protected async update(): Promise<void> {
    return await this.queueUpdate();
  }

  protected async updateState(state: Partial<L>): Promise<void> {
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

  private queueUpdate(): Promise<void> {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => {
      this.startUpdate();
    });

    return new Promise<void>((resolve): void => {
      this.updateResolvers.push(resolve);
    });
  }

  protected abstract startUpdate(): void;

  protected performUpdate(): void {
    this.replaceUpdate();
    this.resolveUpdate();
  }

  protected replaceUpdate(): void {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  protected resolveUpdate(): void {
    this.updateResolvers.forEach((resolve): void => {
      resolve();
    });

    this.updateResolvers = [];
  }
}
