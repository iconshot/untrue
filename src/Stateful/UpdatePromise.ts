import { Emitter } from "../Emitter";

type EmitterSignatures = {
  done: () => void;
  failed: () => void;
};

export class UpdatePromise {
  private emitter: Emitter<EmitterSignatures> = new Emitter();

  private settled: boolean = false;

  constructor(private value: boolean | null) {}

  done(listener: () => void): this {
    this.emitter.off("done");

    this.emitter.on("done", listener);

    if (this.value === true) {
      this.settle(this.value);
    }

    return this;
  }

  failed(listener: () => void): this {
    this.emitter.off("failed");

    this.emitter.on("failed", listener);

    if (this.value === false) {
      this.settle(this.value);
    }

    return this;
  }

  settle(value: boolean): void {
    if (this.settled) {
      return;
    }

    this.settled = true;

    this.emitter.emit(value ? "done" : "failed");
  }
}
