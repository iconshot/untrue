import {
  EverEmitter,
  EverEmitterSignatures,
  OnErrorCallback,
} from "everemitter";

export class Emitter<
  M extends EverEmitterSignatures = EverEmitterSignatures
> extends EverEmitter<M> {
  constructor() {
    super({
      onError: (error, name, ...args): void => {
        Emitter.onError(error, name, ...args);
      },
    });
  }

  public static onError: OnErrorCallback = (error): void => {
    queueMicrotask((): void => {
      throw error;
    });
  };
}
