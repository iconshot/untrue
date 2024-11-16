import { Animation } from "../Animation/Animation";

import { Comparer } from "../Comparer";

import { Ref } from "../Ref";
import { Var } from "../Var";

import { Context } from "../Stateful/Context";
import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Effect } from "./Effect";
import { Hookster, HooksterSignatures } from "./Hookster";

export class Hook {
  public static useUpdate(): () => UpdatePromise {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const update = (): UpdatePromise => {
      return hookster.update();
    };

    hookster.setValue(index, null);

    hookster.increment();

    return update;
  }

  public static useState<K>(
    value: K
  ): [K, (value: K) => UpdatePromise, K | null] {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpValue: K = hookster.hasValue(index)
      ? hookster.getValue(index)
      : value;

    const prevValue: K | null = hookster.getPrevValue(index);

    const updateValue = (value: K): UpdatePromise => {
      return hookster.updateValue(index, value);
    };

    hookster.setValue(index, tmpValue);

    hookster.increment();

    return [tmpValue, updateValue, prevValue];
  }

  public static useRef<K>(value: K | null = null): Ref<K> {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const ref: Ref<K> = hookster.hasValue(index)
      ? hookster.getValue(index)
      : new Ref<K>(value);

    hookster.setValue(index, ref);

    hookster.increment();

    return ref;
  }

  public static useVar<K>(value: K): Var<K> {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpVar: Var<K> = hookster.hasValue(index)
      ? hookster.getValue(index)
      : new Var<K>(value);

    hookster.setValue(index, tmpVar);

    hookster.increment();

    return tmpVar;
  }

  public static useAnimation(value: number): Animation {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const animation: Animation = hookster.hasValue(index)
      ? hookster.getValue(index)
      : new Animation(value);

    hookster.setValue(index, animation);

    hookster.increment();

    return animation;
  }

  public static useMemo<K>(closure: () => K, params: any[] = []): K {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    type Memo = {
      value: K;
      params: any[];
    };

    const index = hookster.index;

    const prevMemo: Memo | null = hookster.getValue(index) ?? null;

    let memo: Memo | null = null;

    if (prevMemo !== null) {
      const equal = Hook.compare(params, prevMemo.params);

      if (equal) {
        memo = { value: prevMemo.value, params };
      }
    }

    memo ??= { value: closure(), params };

    hookster.setValue(index, memo);

    hookster.increment();

    return memo.value;
  }

  public static useEffect(
    closure: () => void | (() => void),
    params: any[] | null = null
  ): void {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const effect = new Effect(closure, params);

    hookster.addEffect(effect);

    hookster.setValue(index, null);

    hookster.increment();
  }

  public static useAsync(
    closure: () => Promise<void>,
    params: any[] | null = null
  ): void {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpClosure = (): void => {
      closure();
    };

    const effect = new Effect(tmpClosure, params);

    hookster.addEffect(effect);

    hookster.setValue(index, null);

    hookster.increment();
  }

  public static useLifecycle<K extends keyof HooksterSignatures>(
    name: K,
    listener: () => any
  ): void {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    hookster.on(name, listener);

    hookster.setValue(index, null);

    hookster.increment();
  }

  public static useContext<B>(
    context: Context | Context[],
    selector: () => B
  ): B {
    const contexts = Array.isArray(context) ? context : [context];

    const update = Hook.useUpdate();

    const selectorVar = Hook.useVar<() => B>(selector);

    selectorVar.value = selector;

    const result = selector();

    const resultVar = Hook.useVar<B>(result);

    resultVar.value = result;

    Hook.useEffect((): (() => void) => {
      let timeout: number | undefined;

      const listener = (): void => {
        clearTimeout(timeout);

        timeout = setTimeout((): void => {
          const selector = selectorVar.value;

          const result = resultVar.value;

          const tmpResult = selector();

          const equal = Comparer.compare(result, tmpResult);

          if (equal) {
            return;
          }

          update();
        });
      };

      for (const context of contexts) {
        context.on("update", listener);
      }

      return (): void => {
        for (const context of contexts) {
          context.off("update", listener);
        }
      };
    }, []);

    return result;
  }

  /*

  Comparer.compare does a deep comparison
  while Hook.compare does a simpler shallow comparison
  based on "params" used in useEffect, useMemo, etc

  */

  public static compare(a: any[] | null, b: any[] | null): boolean {
    if (a === null) {
      return b === null;
    }

    if (!Array.isArray(b)) {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    return a.every((element, i): boolean => element === b[i]);
  }

  public static activeHookster: Hookster | null = null;
}
