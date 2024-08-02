import { EverEmitter, OnErrorClosure } from "everemitter";

export class Emitter extends EverEmitter {
  constructor() {
    super({
      onError: (error, name, ...args): void => {
        Emitter.onError(error, name, ...args);
      },
    });
  }

  public static onError: OnErrorClosure = (error): void => {
    queueMicrotask((): void => {
      throw error;
    });
  };
}
