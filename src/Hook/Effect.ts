import { Emitter } from "../Emitter";

import { Hook } from "./Hook";

type EffectSignatures = {
  run: () => void;
  cleanUp: () => void;
};

/*

in Component, because of the Emitter.onError
an error thrown in an event listener doesn't affect another listener

although this is configurable, we expect this to be the default behavior

hook effects are supposed to be an alternative to component events
so we need to use Emitter here too,
to run the callbacks and the cleanups

in other words, using Emitter here,
an error thrown in an effect won't affect another effect

*/

export class Effect extends Emitter<EffectSignatures> {
  private cleanup: (() => void) | null = null;

  constructor(
    private callback: () => void | (() => void),
    private params: any[] | null
  ) {
    super();

    this.on("run", (): void => {
      this.cleanup = this.callback() ?? null;
    });

    this.on("cleanUp", (): void => {
      if (this.cleanup === null) {
        return;
      }

      this.cleanup();
    });
  }

  public run(prevEffect: Effect | null): void {
    if (this.params !== null) {
      if (prevEffect !== null) {
        const equal = Hook.compare(this.params, prevEffect.params);

        if (equal) {
          this.cleanup = prevEffect.cleanup;

          return;
        }
      }
    }

    if (prevEffect !== null) {
      prevEffect.cleanUp();
    }

    this.emit("run");
  }

  public cleanUp(): void {
    this.emit("cleanUp");
  }
}
