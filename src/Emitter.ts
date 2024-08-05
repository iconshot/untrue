import { EverEmitter, SignatureRecord, OnErrorClosure } from "everemitter";

export class Emitter<M extends SignatureRecord> extends EverEmitter<M> {
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
