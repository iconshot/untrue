import { Emitter } from "../Emitter";
import { Comparer } from "../Comparer";

import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Hook } from "./Hook";
import { Effect } from "./Effect";

export type HooksterSignatures = {
  mount: () => any;
  unmount: () => any;
  update: () => any;
  render: () => any;
};

type AllHooksterSignatures = HooksterSignatures & {
  rerender: () => any;
};

/*

consistent with Component

this class is used to keep hook state of a function component

*/

export class Hookster extends Emitter<AllHooksterSignatures> {
  public index: number = 0;

  private prevIndex: number | null = null;

  private values: any[] = [];

  private prevValues: any[] | null = null;

  private nextValues: Map<number, any> = new Map();

  private effects: Effect[] = [];

  private prevEffects: Effect[] | null = null;

  private mounted: boolean = false;
  private unmounted: boolean = false;

  private updateId: number = -1;
  private nextUpdateId: number = 0;

  private updateTimeout: number | undefined;

  private updatePromises: Map<number, UpdatePromise[]> = new Map();

  public activate(): void {
    Hook.activeHookster = this;
  }

  public deactivate(): void {
    Hook.activeHookster = null;

    if (this.prevIndex !== null && this.index !== this.prevIndex) {
      throw new Error("Irregular number of hooks.");
    }

    if (
      this.prevEffects !== null &&
      this.effects.length !== this.prevEffects.length
    ) {
      throw new Error("Irregular number of hooks.");
    }
  }

  public hasValue(): boolean {
    return this.index < this.values.length;
  }

  public getValue(): any {
    return this.values[this.index];
  }

  public getPrevValue(): any {
    if (this.prevValues === null) {
      return null;
    }

    return this.prevValues[this.index];
  }

  public addValue(value: any): void {
    this.values[this.index] = value;

    this.index++;
  }

  public needsUpdate(): boolean {
    return this.nextValues.size !== 0;
  }

  public update(): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    return this.queueUpdate();
  }

  public updateValue(index: number, value: any): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    if (!this.needsUpdate()) {
      const currentValue = this.values[index];

      const equal = Comparer.compare(value, currentValue);

      if (equal) {
        return new UpdatePromise(true);
      }
    }

    this.nextValues.set(index, value);

    return this.queueUpdate();
  }

  private queueUpdate(): UpdatePromise {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => {
      this.emit("rerender");
    });

    const promise = new UpdatePromise(null);

    let promises = this.updatePromises.get(this.nextUpdateId);

    if (promises === undefined) {
      promises = [];

      this.updatePromises.set(this.nextUpdateId, promises);
    }

    promises.push(promise);

    return promise;
  }

  public performUpdate(): void {
    this.prevIndex = this.index;

    this.index = 0;

    this.off("mount");
    this.off("unmount");
    this.off("update");
    this.off("render");

    this.prevEffects = this.effects;

    this.effects = [];

    clearTimeout(this.updateTimeout);

    this.updateId = this.nextUpdateId;

    this.nextUpdateId++;

    this.replaceUpdate();
  }

  private replaceUpdate(): void {
    this.prevValues = this.values;

    this.values = [...this.values];

    this.nextValues.forEach((value, key): void => {
      this.values[key] = value;
    });

    this.nextValues.clear();
  }

  private settleUpdatePromises(updateId: number, value: boolean): void {
    const promises = this.updatePromises.get(updateId);

    if (promises === undefined) {
      return;
    }

    promises.forEach((promise): void => {
      promise.settle(value);
    });

    this.updatePromises.delete(updateId);
  }

  private settleUpdate(value: boolean): void {
    this.settleUpdatePromises(this.updateId, value);
  }

  private settleNextUpdate(value: boolean): void {
    this.settleUpdatePromises(this.nextUpdateId, value);
  }

  public addEffect(effect: Effect): void {
    this.effects.push(effect);
  }

  private runEffects(): void {
    this.effects.forEach((effect, i): void => {
      const prevEffect = this.prevEffects?.[i] ?? null;

      effect.run(prevEffect);
    });
  }

  private cleanUpEffects(): void {
    this.effects.forEach((effect): void => {
      effect.cleanUp();
    });
  }

  public triggerRender(listener: () => void): void {
    this.off("rerender");

    this.on("rerender", listener);

    if (!this.mounted) {
      this.triggerMount();
    } else {
      this.triggerUpdate();
    }

    this.emit("render");

    this.runEffects();
  }

  public triggerUnmount(): void {
    this.off("rerender");

    this.mounted = false;
    this.unmounted = true;

    this.settleNextUpdate(false);

    this.emit("unmount");

    this.cleanUpEffects();
  }

  private triggerMount(): void {
    this.mounted = true;

    this.emit("mount");
  }

  private triggerUpdate(): void {
    this.settleUpdate(true);

    this.emit("update");
  }
}
