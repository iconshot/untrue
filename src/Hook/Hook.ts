import { SignatureRecord } from "everemitter";

import { Animation } from "../Animation/Animation";

import { Comparer } from "../Comparer";

import { Ref } from "../Ref";
import { Var } from "../Var";

import { Context } from "../Stateful/Context";
import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Effect } from "./Effect";
import { Hookster, HooksterSignatures } from "./Hookster";
import { Emitter } from "../Emitter";

export class Hook {
  public static useUpdate(): () => UpdatePromise {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const update = (): UpdatePromise => {
      return hookster.update();
    };

    return update;
  }

  public static useState<K>(
    value: K
  ): [K, (value: K) => UpdatePromise, K | null] {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpValue: K = hookster.hasValue() ? hookster.getValue() : value;

    const prevValue: K | null = hookster.getPrevValue();

    const updateValue = (value: K): UpdatePromise => {
      return hookster.updateValue(index, value);
    };

    hookster.addValue(tmpValue);

    return [tmpValue, updateValue, prevValue];
  }

  public static useRef<K>(value: K | null = null): Ref<K> {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const ref: Ref<K> = hookster.hasValue()
      ? hookster.getValue()
      : new Ref(value);

    hookster.addValue(ref);

    return ref;
  }

  public static useVar<K>(value: K): Var<K> {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const tmpVar: Var<K> = hookster.hasValue()
      ? hookster.getValue()
      : new Var(value);

    hookster.addValue(tmpVar);

    return tmpVar;
  }

  public static useAnimation(value: number): Animation {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const animation: Animation = hookster.hasValue()
      ? hookster.getValue()
      : new Animation(value);

    hookster.addValue(animation);

    return animation;
  }

  public static useEmitter<T extends SignatureRecord>(): Emitter<T> {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const emitter: Emitter<T> = hookster.hasValue()
      ? hookster.getValue()
      : new Emitter();

    hookster.addValue(emitter);

    return emitter;
  }

  public static useMemo<K>(callback: () => K, params: any[] = []): K {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    type Memo = {
      value: K;
      params: any[];
    };

    const prevMemo: Memo | null = hookster.hasValue()
      ? hookster.getValue()
      : null;

    let memo: Memo | null = null;

    if (prevMemo !== null) {
      const equal = this.compare(params, prevMemo.params);

      if (equal) {
        memo = { value: prevMemo.value, params };
      }
    }

    memo ??= { value: callback(), params };

    hookster.addValue(memo);

    return memo.value;
  }

  public static useCallback<K, T extends any[] = any[]>(
    callback: (...args: T) => K,
    params: any[] = []
  ): (...args: T) => K {
    return this.useMemo((): ((...args: T) => K) => callback, params);
  }

  public static useLifecycle<K extends keyof HooksterSignatures>(
    name: K,
    listener: () => any
  ): void {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    hookster.on(name, listener);
  }

  public static useMountLifecycle(listener: () => any) {
    this.useLifecycle("mount", listener);
  }

  public static useUpdateLifecycle(listener: () => any) {
    this.useLifecycle("update", listener);
  }

  public static useRenderLifecycle(listener: () => any) {
    this.useLifecycle("render", listener);
  }

  public static useUnmountLifecycle(listener: () => any) {
    this.useLifecycle("unmount", listener);
  }

  public static useLateMountLifecycle(listener: () => any) {
    this.useLifecycle("lateMount", listener);
  }

  public static useLateUpdateLifecycle(listener: () => any) {
    this.useLifecycle("lateUpdate", listener);
  }

  public static useLateRenderLifecycle(listener: () => any) {
    this.useLifecycle("lateRender", listener);
  }

  public static useLateUnmountLifecycle(listener: () => any) {
    this.useLifecycle("lateUnmount", listener);
  }

  public static useEffect(
    callback: () => void | (() => void),
    params: any[] | null = null
  ): void {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const effect = new Effect(callback, params);

    hookster.addEffect(effect);
  }

  public static useMountEffect(callback: () => void | (() => void)): void {
    this.useEffect(callback, []);
  }

  public static useUpdateEffect(
    callback: () => void | (() => void),
    params: any[] | null = null
  ): void {
    const mountedVar = this.useVar(false);

    this.useEffect((): void | (() => void) => {
      if (mountedVar.value) {
        return callback();
      }

      mountedVar.value = true;
    }, params);
  }

  public static useAsyncEffect(
    callback: () => Promise<void>,
    params: any[] | null = null
  ): void {
    this.useEffect((): void => {
      callback();
    }, params);
  }

  public static useLateEffect(
    callback: () => void | (() => void),
    params: any[] | null = null
  ): void {
    const hookster = Hookster.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const effect = new Effect(callback, params);

    hookster.addLateEffect(effect);
  }

  public static useLateMountEffect(callback: () => void | (() => void)): void {
    this.useLateEffect(callback, []);
  }

  public static useLateUpdateEffect(
    callback: () => void | (() => void),
    params: any[] | null = null
  ): void {
    const mountedVar = this.useVar(false);

    this.useLateEffect((): void | (() => void) => {
      if (mountedVar.value) {
        return callback();
      }

      mountedVar.value = true;
    }, params);
  }

  public static useLateAsyncEffect(
    callback: () => Promise<void>,
    params: any[] | null = null
  ): void {
    this.useLateEffect((): void => {
      callback();
    }, params);
  }

  public static useContext<B>(
    context: Context | Context[],
    selector: () => B
  ): B {
    const contexts = Array.isArray(context) ? context : [context];

    const update = this.useUpdate();

    const selectorVar = this.useVar<() => B>(selector);

    selectorVar.value = selector;

    const result = selector();

    const resultVar = this.useVar<B>(result);

    resultVar.value = result;

    this.useEffect((): (() => void) => {
      let timeout: number | undefined;

      const listener = (): void => {
        clearTimeout(timeout);

        timeout = setTimeout((): void => {
          const selector = selectorVar.value;

          const result = resultVar.value;

          const tmpResult = selector();

          const equal = Comparer.compare(tmpResult, result);

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
    }, contexts);

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
}
