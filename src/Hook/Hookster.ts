import { Emitter } from "../Emitter";
import { Comparer } from "../Comparer";

import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Hook } from "./Hook";
import { Effect } from "./Effect";

export type HooksterSignatures = {
  mount: () => any;
  update: () => any;
  render: () => any;
  unmount: () => any;
  immediateMount: () => any;
  immediateUpdate: () => any;
  immediateRender: () => any;
  immediateUnmount: () => any;
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

  private immediateEffects: Effect[] = [];

  private prevImmediateEffects: Effect[] | null = null;

  private mounted: boolean = false;
  private unmounted: boolean = false;

  private updateId: number = -1;
  private nextUpdateId: number = 0;

  private updateTimeout: number | undefined;

  private updateQueued: boolean = false;

  private updatePromises: Map<number, UpdatePromise[]> = new Map();

  public initialize(listener: () => void): void {
    this.on("rerender", listener);
  }

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

    if (
      this.prevImmediateEffects !== null &&
      this.immediateEffects.length !== this.prevImmediateEffects.length
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
    return this.updateQueued;
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

    if (!this.updateQueued) {
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

  private startUpdate(): void {
    this.emit("rerender");
  }

  public performUpdate(): void {
    this.prevIndex = this.index;

    this.index = 0;

    this.off("mount");
    this.off("update");
    this.off("render");
    this.off("unmount");
    this.off("immediateMount");
    this.off("immediateUpdate");
    this.off("immediateRender");
    this.off("immediateUnmount");

    this.prevEffects = this.effects;

    this.effects = [];

    this.prevImmediateEffects = this.immediateEffects;

    this.immediateEffects = [];

    clearTimeout(this.updateTimeout);

    this.updateId = this.nextUpdateId;

    this.nextUpdateId++;

    this.updateQueued = false;

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

    promises.forEach((promise): void => promise.settle(value));

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
    this.effects.forEach((effect): void => effect.cleanUp());
  }

  public addImmediateEffect(effect: Effect): void {
    this.immediateEffects.push(effect);
  }

  private runImmediateEffects(): void {
    this.immediateEffects.forEach((effect, i): void => {
      const prevEffect = this.prevImmediateEffects?.[i] ?? null;

      effect.run(prevEffect);
    });
  }

  private cleanUpImmediateEffects(): void {
    this.immediateEffects.forEach((effect): void => effect.cleanUp());
  }

  public finishRender(): void {
    const mounted = this.mounted;

    this.mounted = true;

    setTimeout((): void => {
      if (!mounted) {
        this.emit("mount");
      } else {
        this.settleUpdate(true);

        this.emit("update");
      }

      this.emit("render");

      this.runEffects();
    });

    if (!mounted) {
      this.emit("immediateMount");
    } else {
      this.emit("immediateUpdate");
    }

    this.emit("immediateRender");

    this.runImmediateEffects();
  }

  public finishUnmount(): void {
    this.off("rerender");

    this.mounted = false;
    this.unmounted = true;

    setTimeout((): void => {
      this.settleNextUpdate(false);

      this.emit("unmount");

      this.cleanUpEffects();
    });

    this.emit("immediateUnmount");

    this.cleanUpImmediateEffects();
  }
}
