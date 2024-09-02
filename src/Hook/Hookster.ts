import { Emitter } from "../Emitter";
import { Comparer } from "../Comparer";

import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Hook } from "./Hook";
import { Effect } from "./Effect";

type HooksterSignatures = {
  rerender: () => void;
  "effect.run": () => void;
  "effect.cleanup": () => void;
};

/*

a lot of this Hookster class is consistent with Component
for brevity we have changed the names, for example:

Component.updateTimeout -> Hookster.timeout
Component.queueUpdate -> Hookster.queue
Component.replaceUpdate -> Hookster.replace

and so on...

Hookster.hooked is consistent with Component.mounted
and Hookster.unhooked with Component.unmounted,
they are set in the same places

the reason why they don't have the same names even though they represent the same booleans
is that a hookster is never actually "mounted" in the Tree,
the final user doesn't work with a hookster instance the way they could with class components,
a hookster is just used by Tree to add hooks support to function components, and that's it

Component.triggerRender -> Hookster.hook
Component.triggerUnmount -> Hookster.unhook

in the Tree abstraction,
both triggerRender and hook methods are placed
at the end of the renderComponent and renderFunction respectively

same with triggerUnmount and unhook,
they are both placed in an unmountEdge method

*/

export class Hookster extends Emitter<HooksterSignatures> {
  public index: number = 0;

  private prevIndex: number | null = null;

  private values: any[] = [];

  private nextValues: Map<number, any> = new Map();

  private effects: Effect[] = [];

  private prevEffects: Effect[] = [];

  private hooked: boolean = false;
  private unhooked: boolean = false;

  private updateId: number = -1;
  private nextUpdateId: number = 0;

  private timeout: number | undefined;

  private promises: Map<number, UpdatePromise[]> = new Map();

  public activate(): void {
    Hook.activeHookster = this;

    /*

    since this.hooked is set to true only in the hook() method
    it will be false in the first activate() call

    so that would leave us with:
    
    hooked false means "mount"
    hooked true means "update"

    this is not exclusive to Hookster though,
    the same thing applies to Component
    where the first triggerRender will have a false `mounted`
    meaning it's a "mount" call

    */

    if (!this.hooked) {
      return;
    }

    /*

    these next lines would be the
    equivalent to Component's updateProps -> performUpdate
    where we prepare the update (change state/props)
    so everything is ready for the next component.render()

    in this case, everything will have to be ready
    for the next function component call

    */

    this.prevIndex = this.index;

    this.index = 0;

    this.prevEffects = this.effects;

    this.effects = [];

    clearTimeout(this.timeout);

    this.updateId = this.nextUpdateId;

    this.nextUpdateId++;

    this.replace();
  }

  public deactivate(): void {
    Hook.activeHookster = null;

    if (this.prevIndex !== null && this.index !== this.prevIndex) {
      throw new Error("Irregular number of hooks.");
    }
  }

  public has(index: number): boolean {
    return index < this.values.length;
  }

  public get(index: number): any {
    return this.values[index];
  }

  public set(index: number, value: any): void {
    this.values[index] = value;
  }

  public increment(): void {
    this.index++;
  }

  public update(): UpdatePromise {
    if (this.unhooked) {
      return new UpdatePromise(false);
    }

    return this.queue();
  }

  public updateValue(index: number, value: any): UpdatePromise {
    if (this.unhooked) {
      return new UpdatePromise(false);
    }

    if (!this.nextValues.has(index)) {
      const currentValue = this.values[index];

      const equal = Comparer.compare(value, currentValue);

      if (equal) {
        return new UpdatePromise(true);
      }
    }

    this.nextValues.set(index, value);

    return this.queue();
  }

  public queue(): UpdatePromise {
    clearTimeout(this.timeout);

    this.timeout = setTimeout((): void => {
      this.emit("rerender");
    });

    const promise = new UpdatePromise(null);

    let promises = this.promises.get(this.nextUpdateId);

    if (promises === undefined) {
      promises = [];

      this.promises.set(this.nextUpdateId, promises);
    }

    promises.push(promise);

    return promise;
  }

  private replace(): void {
    this.nextValues.forEach((value, key): void => {
      this.values[key] = value;
    });

    this.nextValues.clear();
  }

  private settlePromises(updateId: number, value: boolean): void {
    const promises = this.promises.get(updateId);

    if (promises === undefined) {
      return;
    }

    promises.forEach((promise): void => {
      promise.settle(value);
    });

    this.promises.delete(updateId);
  }

  private settle(value: boolean): void {
    this.settlePromises(this.updateId, value);
  }

  private settleNext(value: boolean): void {
    this.settlePromises(this.nextUpdateId, value);
  }

  public addEffect(effect: Effect): void {
    this.effects.push(effect);
  }

  public runEffects(): void {
    this.effects.forEach((effect, i): void => {
      const prevEffect = this.prevEffects[i] ?? null;

      effect.run(prevEffect);
    });
  }

  public cleanUpEffects(): void {
    this.effects.forEach((effect): void => {
      effect.cleanUp();
    });
  }

  public hook(listener: () => void): void {
    this.off("rerender");

    this.on("rerender", listener);

    if (!this.hooked) {
      // mount

      this.hooked = true;
    } else {
      // update

      this.settle(true);
    }

    this.runEffects();
  }

  public unhook(): void {
    this.off("rerender");

    this.hooked = false;
    this.unhooked = true;

    this.settleNext(false);

    this.cleanUpEffects();
  }
}
