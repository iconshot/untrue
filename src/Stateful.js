import EventEmitter from "eventemitter3";

import Comparer from "./Comparer.js";

class Stateful extends EventEmitter {
  constructor() {
    super();

    this.state = {};

    this.prevState = null;
    this.nextState = null;

    this.updateTimeout = null;

    this.updateResolvers = [];
  }

  getState() {
    return this.state;
  }

  triggerUpdate() {
    queueMicrotask(() => this.emit("update"));
  }

  async update() {
    return await this.startUpdate();
  }

  async updateState(state) {
    const tmpState = { ...this.state, ...this.nextState, ...state };

    const currentState = { ...this.state, ...this.nextState };

    const updated = !Comparer.compareDeep(tmpState, currentState);

    if (updated) {
      this.nextState = tmpState;

      return await this.startUpdate();
    }
  }

  startUpdate() {
    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  prepareUpdate() {
    this.replaceUpdate();
    this.resolveUpdate();
  }

  replaceUpdate() {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  resolveUpdate() {
    this.updateResolvers.forEach((resolve) => resolve());

    this.updateResolvers = [];
  }
}

export default Stateful;
