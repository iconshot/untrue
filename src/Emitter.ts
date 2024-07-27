import { EverEmitter, OnErrorClosure } from "everemitter";

export class Emitter extends EverEmitter {
  constructor() {
    super({
      onError: (error, name, ...args) => {
        Emitter.onError(error, name, ...args);
      },
    });
  }

  public static onError: OnErrorClosure = (error) => {
    queueMicrotask(() => {
      throw error;
    });
  };
}
