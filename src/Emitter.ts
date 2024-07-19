import { EverEmitter } from "everemitter";

export class Emitter extends EverEmitter {
  constructor() {
    super({
      onError: (error) => {
        queueMicrotask(() => {
          throw error;
        });
      },
    });
  }
}
