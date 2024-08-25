import { Emitter } from "../Emitter";

import { Animation } from "./Animation";

import { AnimationFrame } from "./AnimationFrame";

type TransitionSignatures = {
  start: () => void;
  pause: () => void;
  end: () => void;
  cancel: () => void;
};

export class Transition extends Emitter<TransitionSignatures> {
  private canceled: boolean = false;

  private initialValue: number;

  private currentTime: number = 0;

  private frame: number | undefined;

  constructor(
    private animation: Animation,
    private finalValue: number,
    private finalTime: number,
    private easing: ((x: number) => number) | null
  ) {
    super();

    this.initialValue = animation.getValue();
  }

  start(): void {
    if (this.canceled) {
      return;
    }

    const initialCurrentTime = this.currentTime;

    let startTime: number | null = null;

    const callback = (rafTime: number) => {
      // set startTime

      if (startTime === null) {
        startTime = rafTime;
      }

      /*
      
      calculate this.currentTime based on initialCurrentTime
      useful to resume a paused transition right from where it left

      */

      this.currentTime = initialCurrentTime + rafTime - startTime;

      this.update();

      // end transition or request frame

      if (this.isTimeUp()) {
        this.end();

        return;
      }

      this.frame = AnimationFrame.request(callback);
    };

    this.frame = AnimationFrame.request(callback);

    this.emit("start");
  }

  public pause(): void {
    if (this.canceled) {
      return;
    }

    AnimationFrame.cancel(this.frame);

    this.emit("pause");
  }

  public cancel(): void {
    if (this.canceled) {
      return;
    }

    this.canceled = true;

    AnimationFrame.cancel(this.frame);

    this.emit("cancel");
  }

  private end(): void {
    if (this.canceled) {
      return;
    }

    this.currentTime = 0;

    this.emit("end");
  }

  private update(): void {
    let currentValue = 0;

    if (this.currentTime === 0) {
      currentValue = this.initialValue;
    } else if (this.isTimeUp()) {
      currentValue = this.finalValue;
    } else {
      const totalOffset = this.finalValue - this.initialValue;

      /*
      
      rule of three:

      this.currentTime              this.finalTime
      currentOffset (x)             totalOffset

      currentOffset will be the number between
      this.finalValue - this.initalValue and 0

      currentOffset will need to be added to this.initialValue
      to get the currentValue

      */

      let currentOffset = (this.currentTime * totalOffset) / this.finalTime;

      if (this.easing !== null) {
        /*

        if there's an easing function,
        we calculate the ratio currentOffset / totalOffset
        it will be a decimal number from 0 to 1

        we pass the ratio to the easing function to get a new ratio
        to calculate the new currentOffset

        */

        const linearRatio = currentOffset / totalOffset;

        const easingRatio = this.easing(linearRatio);

        currentOffset = totalOffset * easingRatio;
      }

      currentValue = this.initialValue + currentOffset;
    }

    this.animation.updateValue(currentValue);
  }

  private isTimeUp(): boolean {
    return this.currentTime >= this.finalTime;
  }
}

export default Transition;
