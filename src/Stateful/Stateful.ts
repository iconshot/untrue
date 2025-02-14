import { Comparer } from "../Comparer";
import { Emitter } from "../Emitter";

import { UpdatePromise } from "./UpdatePromise";

export interface State {}

export type StatefulSignatures = {
  update: () => any;
  immediateUpdate: () => any;
};

export abstract class Stateful<
  L extends State,
  M extends StatefulSignatures
> extends Emitter<M> {
  protected state: L = {} as L;

  protected prevState: L | null = null;
  protected nextState: L | null = null;

  private updateId: number = -1;
  private nextUpdateId: number = 0;

  private updateTimeout: number | undefined;

  private updateQueued: boolean = false;

  private updatePromises: Map<number, UpdatePromise[]> = new Map();

  public needsUpdate(): boolean {
    return this.updateQueued;
  }

  protected update(): UpdatePromise {
    return this.queueUpdate();
  }

  protected updateState(state: Partial<L>): UpdatePromise {
    if (!this.updateQueued) {
      const tmpState = { ...this.state, ...state };

      const equal = Comparer.compare(tmpState, this.state);

      if (equal) {
        return new UpdatePromise(true);
      }
    }

    this.nextState = { ...this.state, ...this.nextState, ...state };

    return this.queueUpdate();
  }

  private queueUpdate(): UpdatePromise {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => this.startUpdate());

    this.updateQueued = true;

    const promise = new UpdatePromise(null);

    let promises = this.updatePromises.get(this.nextUpdateId);

    if (promises === undefined) {
      promises = [];

      this.updatePromises.set(this.nextUpdateId, promises);
    }

    promises.push(promise);

    return promise;
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

    this.updateId = this.nextUpdateId;

    this.nextUpdateId++;

    this.updateQueued = false;

    this.replaceUpdate();
  }

  protected replaceUpdate(): void {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  /*

  when settleUpdate comes from finishUpdate
  we want to settle promises for this.updateId
  because performUpdate has been called already
  so this.updateId will changed to the previous this.nextUpdateId

  however, in the Component class
  settleUpdate may come from finishUnmount,
  in that case the updateId hasn't been changed
  because it never gets to performUpdate,
  so we want to settle promises for this.nextUpdateId instead

  why would we have promises for a component that will be unmounted?
  Parent and Child update at the same time
  their promises are pending
  but when we render Parent, we see that it wants to unmount Child
  so the "unmount" happens but the Child promises are still there,
  that's when we call settleUpdate with a false value for Child
  to trigger the failed() listeners if there are any

  done() -> the update was successful
  failed() -> the update couldn't happen at all

  */

  private settleUpdatePromises(updateId: number, value: boolean): void {
    const promises = this.updatePromises.get(updateId);

    if (promises === undefined) {
      return;
    }

    promises.forEach((promise): void => promise.settle(value));

    this.updatePromises.delete(updateId);
  }

  protected settleUpdate(value: boolean): void {
    this.settleUpdatePromises(this.updateId, value);
  }

  protected settleNextUpdate(value: boolean): void {
    this.settleUpdatePromises(this.nextUpdateId, value);
  }
}
