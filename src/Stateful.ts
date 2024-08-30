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

  private updateTimeout: number | undefined;

  private updateResolvers: UpdateResolver[] = [];

  public init(): void {}

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
    /*

    about the clearTimeout here:
    
    for components, because of batching, Tree delays the performUpdate calls;
    by the time we reach this method,
    we may have another updateTimeout waiting
    but we can clear it out here since any change done to nextState
    is about to be moved to state...
    it's worth noting that this won't cause issues with any updateResolver
    because they are created right after updateTimeout is set
    and they're about to be resolved also.

    for contexts, this won't cause any problem
    because it's the timeout itself the one that ends up reaching this method

    */

    clearTimeout(this.updateTimeout);

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
