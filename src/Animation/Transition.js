import EventEmitter from "eventemitter3";

export class Transition extends EventEmitter {
  constructor(animation, value, time, easing = null) {
    super();

    this.animation = animation; // animation that created this transition
    this.value = value; // ending value
    this.time = time; // ending time
    this.easing = easing; // easing function, it can be null

    this.canceled = false;

    this.initialValue = this.animation.getValue();

    this.currentTime = 0;

    this.raf = null;
  }

  play() {
    if (this.canceled) {
      return;
    }

    const currentTime = this.currentTime;

    let startTime = null;

    const callback = (time) => {
      // set startTime

      if (startTime === null) {
        startTime = time;
      }

      /*
      
      calculate currentTime based on the starting this.currentTime
      useful to resume paused transitions right from where it left

      */

      this.currentTime = currentTime + time - startTime;

      this.update();

      // end or call RAF

      if (this.currentTime >= this.time) {
        this.end();
      } else {
        this.raf = requestAnimationFrame(callback);
      }
    };

    this.raf = requestAnimationFrame(callback);

    this.emit("play");
  }

  pause() {
    cancelAnimationFrame(this.raf);

    this.raf = null;

    this.emit("pause");
  }

  cancel() {
    this.canceled = true;

    cancelAnimationFrame(this.raf);

    this.raf = null;

    this.emit("cancel");
  }

  end() {
    this.raf = null;

    this.currentTime = 0;

    this.emit("end");
  }

  update() {
    let animationValue = 0;

    if (this.currentTime === 0) {
      // initial value

      animationValue = this.initialValue;
    } else if (this.currentTime >= this.time) {
      // ending value

      animationValue = this.value;
    } else {
      const totalOffset = this.value - this.initialValue;

      /*
      
      rule of three:

      this.currentTime              this.time
      currentOffset (x)             totalOffset

      currentOffset will be the number between
      the difference of this.value - this.initalValue and 0

      currentOffset will need to be added to this.initialValue
      to calculate the animationValue

      */

      let currentOffset = (this.currentTime * totalOffset) / this.time;

      if (this.easing !== null) {
        /*

        if there's an easing function, we calculate the ratio of currentOffset to totalOffset
        number will be a decimal number from 0 to 1

        we pass the easing function to that number

        to calculate the new currentOffset,
        totalOffset is multiplied by the easingNumber returned

        */

        const number = currentOffset / totalOffset;

        const easingNumber = this.easing(number);

        currentOffset = totalOffset * easingNumber;
      }

      animationValue = this.initialValue + currentOffset;
    }

    this.animation.update(animationValue);
  }
}

export default Transition;
