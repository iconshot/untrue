import EventEmitter from "eventemitter3";

import { Transition } from "./Transition";

export class Animation extends EventEmitter {
  constructor(value) {
    super();

    this.value = value;

    this.transition = null;
  }

  getValue() {
    return this.value;
  }

  getTransition() {
    return this.transition;
  }

  update(value) {
    this.value = value;

    this.emit("update");
  }

  bind(component, listener) {
    component.on("render", listener);

    component.on("mount", () => {
      this.on("update", listener);
    });

    component.on("unmount", () => {
      this.off("update", listener);
    });
  }

  animate(value, time, easing = null) {
    // if found, cancel current transition

    if (this.transition !== null) {
      this.transition.cancel();
    }

    this.transition = new Transition(this, value, time, easing);

    // a setTimeout is needed so the caller can add a "play" event handler

    setTimeout(() => {
      this.transition.play();
    });

    return this.transition;
  }

  /*

  "1.54" -> { number: 1.54, unit: ""}
  "1.54%" -> { number: 1.54, unit: "%"}
  "1.54rem" -> { number: 1.54, unit: "rem"}
  "string" -> Error

  */

  split(item) {
    let number = 0;
    let unit = "";

    const split = item
      .trim()
      .split(/(-?\d+(?:\.\d+)?)/g)
      .filter((string) => string !== "");

    switch (split.length) {
      case 0: {
        throw new Error("Invalid output item.");

        break;
      }

      case 1: {
        number = parseFloat(item);

        break;
      }

      default: {
        number = parseFloat(split[0]);
        unit = split[1];

        break;
      }
    }

    if (Number.isNaN(number)) {
      throw new Error("Invalid output item.");
    }

    return { number, unit };
  }

  interpolate(input, output) {
    if (input.length <= 1) {
      throw new Error("Input needs at least two items.");
    }

    if (output.length <= 1) {
      throw new Error("Output needs at least two items.");
    }

    if (input.length !== output.length) {
      throw new Error("Input length and output length must be the same.");
    }

    const checkRepeated = input.every((item, i) => input.indexOf(item) === i);

    if (!checkRepeated) {
      throw new Error("Input must not have repeated items.");
    }

    const checkAscending = input.every((item, i) =>
      i !== 0 ? item > input[i - 1] : true
    );

    if (!checkAscending) {
      throw new Error("Input must be in ascending order.");
    }

    // split output array

    const items = output.map((item) => this.split(item));

    const checkUnits = items.every((item) => item.unit === items[0].unit);

    if (!checkUnits) {
      throw new Error("All output units must be the same.");
    }

    const numbers = items.map((item) => item.number);

    let number = null; // returned number

    const unit = items[0].unit; // same for every returned value

    const inputIndex = input.indexOf(this.value);

    if (inputIndex !== -1) {
      // the value is found in the input array

      number = numbers[inputIndex];
    } else {
      // do the normal interpolate process

      let currentInput = null;
      let nextInput = null;
      let currentNumber = null;
      let nextNumber = null;

      const lastInputIndex = input.length - 1;

      if (this.value > input[lastInputIndex]) {
        // value is greater than the last input's item

        const index = lastInputIndex;

        // nextInput will be last + (last - penutimate)

        currentInput = input[index];
        nextInput = input[index] + (input[index] - input[index - 1]);

        // nextNumber will be last + (last - penultimate)

        currentNumber = numbers[index];
        nextNumber = numbers[index] + (numbers[index] - numbers[index - 1]);
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

        currentNumber = numbers[index];
        nextNumber = numbers[index + 1];
      }

      /*

      this.value 0.5

      currentInput                    nextInput
      0                               1

      currentNumber                   nextNumber
      0                               10
      
      rule of three:

      10 - 0 = 10                     1 - 0 = 1
      x                               0.5 - 0 = 0.5

      x = 5

      number = 0 + x
             = 0 + 5 = 5

      */

      const inputDifference = nextInput - currentInput;
      const numberDifference = nextNumber - currentNumber;
      const valueDifference = this.value - currentInput;

      const x = (numberDifference * valueDifference) / inputDifference;

      number = currentNumber + x;
    }

    return `${number}${unit}`;
  }
}
