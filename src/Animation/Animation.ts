import Component from "../Component";

import { Emitter } from "../Emitter";

import { Transition } from "./Transition";

type AnimationSignatures = {
  update: () => void;
};

export class Animation extends Emitter<AnimationSignatures> {
  private transition: Transition | null = null;

  constructor(private value: number) {
    super();
  }

  public getValue(): number {
    return this.value;
  }

  public updateValue(value: number) {
    this.value = value;

    this.emit("update");
  }

  public bind(component: Component, listener: () => void): void {
    component.on("mount", listener);

    component.on("mount", () => {
      this.on("update", listener);
    });

    component.on("unmount", () => {
      this.off("update", listener);
    });
  }

  public animate(
    value: number,
    time: number,
    easing: ((x: number) => number) | null = null
  ): Transition {
    // if found, cancel current transition

    if (this.transition !== null) {
      this.transition.cancel();
    }

    const transition = new Transition(this, value, time, easing);

    // a setTimeout is needed so the caller can add a "start" event handler

    setTimeout((): void => {
      transition.start();
    });

    this.transition = transition;

    return this.transition;
  }

  /*

  "1.54" -> { num: 1.54, unit: null}
  "1.54%" -> { num: 1.54, unit: "%"}
  "1.54rem" -> { num: 1.54, unit: "rem"}
  "hello" -> Error

  */

  private split(item: string): { num: number; unit: string | null } {
    let num: number = 0;
    let unit: string | null = null;

    const regex = /^(\d*\.\d+|\d+)([a-zA-Z%]+)?$/;

    const match = item.match(regex);

    if (match === null) {
      throw new Error("Invalid output item.");
    }

    num = parseFloat(match[1]);

    if (match[2] !== undefined) {
      unit = match[2];
    }

    return { num, unit };
  }

  public interpolate<V extends string[] | number[]>(
    input: number[],
    output: V
  ): V extends string[] ? string : number {
    if (input.length < 2) {
      throw new Error("Input needs at least two items.");
    }

    if (input.length !== output.length) {
      throw new Error("Input and output must have the same number of items.");
    }

    const checkRepeated = input.every(
      (item, i): boolean => input.indexOf(item) === i
    );

    if (!checkRepeated) {
      throw new Error("Input must not have repeated items.");
    }

    const checkAscending = input.every((item, i): boolean =>
      i !== 0 ? item > input[i - 1] : true
    );

    if (!checkAscending) {
      throw new Error("Input must be in ascending order.");
    }

    const types = output.map((item: string | number): string => typeof item);

    const checkTypes = types.every((type) => type === types[0]);

    if (!checkTypes) {
      throw new Error(
        "Output must be an array of strings or an array of numbers."
      );
    }

    const isOutputStringArray = types[0] === "string";

    // split output items

    const items = output.map(
      (item: string | number): { num: number; unit: string | null } => {
        return isOutputStringArray
          ? this.split(item as string)
          : { num: item as number, unit: null };
      }
    );

    const checkUnits = items.every(
      (item): boolean => item.unit === items[0].unit
    );

    if (!checkUnits) {
      throw new Error("All output units must be the same.");
    }

    const nums = items.map((item): number => item.num);

    let num: number; // returned number

    const unit = items[0].unit; // same for every item

    const inputIndex = input.indexOf(this.value);

    if (inputIndex !== -1) {
      // the value is found in the input array

      num = nums[inputIndex];
    } else {
      // do the normal interpolate process

      let currentInput: number;
      let nextInput: number;
      let currentNum: number;
      let nextNum: number;

      const lastInputIndex = input.length - 1;

      if (this.value > input[lastInputIndex]) {
        // value is greater than the last input's item

        const index = lastInputIndex;

        // nextInput will be last + (last - penutimate)

        currentInput = input[index];
        nextInput = input[index] + (input[index] - input[index - 1]);

        // nextNum will be last + (last - penultimate)

        currentNum = nums[index];
        nextNum = nums[index] + (nums[index] - nums[index - 1]);
      } else {
        /*
        
        value is between the first and last input's items,
        it could be less than the first item also

        index = currentIndex

        */

        let index = 0;

        for (let i = 0; i < input.length; i++) {
          if (input[i] > this.value) {
            break;
          }

          index = i;
        }

        currentInput = input[index];
        nextInput = input[index + 1];

        currentNum = nums[index];
        nextNum = nums[index + 1];
      }

      /*

      this.value 0.5

      currentInput                    nextInput
      0                               1

      currentNum                      nextNum
      0                               10
      
      rule of three:

      10 - 0 = 10                     1 - 0 = 1
      offset (x)                      0.5 - 0 = 0.5

      x = 5

      num = 0 + x
          = 0 + 5 = 5

      */

      const inputDifference = nextInput - currentInput;
      const numDifference = nextNum - currentNum;
      const valueDifference = this.value - currentInput;

      const offset = (valueDifference * numDifference) / inputDifference;

      num = currentNum + offset;
    }

    if (isOutputStringArray) {
      return `${num}${unit ?? ""}` as any;
    }

    return num as any;
  }
}
