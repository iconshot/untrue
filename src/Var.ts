import { Hook } from "./Hook/Hook";
import { Component } from "./Stateful/Component";

import { Emitter } from "./Emitter";

type VarSignatures = {
  update: () => any;
};

export class Var<K> extends Emitter<VarSignatures> {
  #value: K;

  constructor(value: K) {
    super();

    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  set value(value: K) {
    this.#value = value;

    this.emit("update");
  }

  public bind(component: Component, listener: () => void): void {
    component.on("mount", (): void => {
      this.on("update", listener);
    });

    component.on("unmount", (): void => {
      this.off("update", listener);
    });
  }

  public use(listener: () => void): void {
    const listenerVar = Hook.useVar<() => void>(listener);

    listenerVar.value = listener;

    const callback = Hook.useCallback((): void => {
      const listener = listenerVar.value;

      listener();
    });

    Hook.useMountLifecycle((): void => {
      this.on("update", callback);
    });

    Hook.useUnmountLifecycle((): void => {
      this.off("update", callback);
    });
  }
}
