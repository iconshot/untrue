import { Animation } from "../Animation/Animation";

import { Comparer } from "../Comparer";

import { Ref } from "../Ref";
import { Var } from "../Var";

import { Context } from "../Stateful/Context";
import { UpdatePromise } from "../Stateful/UpdatePromise";

import { Effect } from "./Effect";
import { Hookster } from "./Hookster";

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

    hookster.set(index, null);

    hookster.increment();

    return update;
  }

  public static useState<K>(value: K): [K, (value: K) => UpdatePromise] {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpValue = hookster.has(index) ? hookster.get(index) : value;

    const updateValue = (value: K): UpdatePromise => {
      return hookster.updateValue(index, value);
    };

    hookster.set(index, tmpValue);

    hookster.increment();

    return [tmpValue, updateValue];
  }

  public static useRef<K>(value: K | null = null): Ref<K> {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const ref = hookster.has(index) ? hookster.get(index) : new Ref<K>(value);

    hookster.set(index, ref);

    hookster.increment();

    return ref;
  }

  public static useVar<K>(value: K): Var<K> {
    const hookster = this.activeHookster;

    if (hookster === null) {
      throw new Error("Hook not available.");
    }

    const index = hookster.index;

    const tmpVar = hookster.has(index)
      ? hookster.get(index)
      : new Var<K>(value);

    hookster.set(index, tmpVar);

    hookster.increment();

    return tmpVar;
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

    const prevMemo: Memo = hookster.get(index) ?? null;

    let memo: Memo | null = null;

    if (prevMemo !== null) {
      const equal = Comparer.compare(params, prevMemo.params);

      if (equal) {
        memo = { value: prevMemo.value, params };
      }
    }

    if (memo === null) {
      memo = { value: closure(), params };
    }

    hookster.set(index, memo);

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

    hookster.set(index, null);

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

    hookster.set(index, null);

    hookster.increment();
  }

  public static useContext<B>(
    context: Context | Context[],
    selector: () => B | null
  ): B | null {
    const contexts = Array.isArray(context) ? context : [context];

    const update = Hook.useUpdate();

    const result = selector();

    Hook.useEffect((): (() => void) => {
      let timeout: number | undefined;

      const listener = (): void => {
        clearTimeout(timeout);

        timeout = setTimeout((): void => {
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
    });

    return result;
  }

  private static selectContext<B>(
    selectors: ((data: Partial<B>) => Partial<B> | null)[]
  ): B | null {
    return selectors.reduce<Partial<B> | null>(
      (result, selector): Partial<B> | null => {
        if (result === null) {
          return null;
        }

        const tmpResult = selector(result);

        if (tmpResult === null) {
          return null;
        }

        const mergedResult = { ...result, ...tmpResult };

        return mergedResult;
      },
      {}
    ) as B | null;
  }

  // consistent with Animation.bind

  public static useAnimation(animation: Animation, listener: () => void): void {
    const listenerVar = Hook.useVar<() => void>(listener);

    // initial animation and listener

    Hook.useEffect(() => {
      animation.on("update", listener);

      return () => {
        animation.off("update", listener);
      };
    }, []);

    // listenerVar.current is the initial listener

    Hook.useEffect(listenerVar.current);
  }

  public static activeHookster: Hookster | null = null;
}
