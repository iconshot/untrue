const EventEmitter = require("eventemitter3");

const Comparer = require("./Comparer");

class Stateful extends EventEmitter {
  constructor() {
    super();

    this.state = {};

    this.prevState = null;
    this.nextState = null;

    this.updateTimeout = null; // batch multiple update calls

    this.updateResolvers = []; // allows us to use await in update/updateState
  }

  getState() {
    return this.state;
  }

  // finish the update

  triggerUpdate() {
    this.resolveUpdated();

    this.emit("update");
  }

  // force update

  async update() {
    return await this.startUpdated();
  }

  // start updating if necessary

  async updateState(state) {
    const tmpState = { ...this.state, ...this.nextState, ...state };

    const currentState = { ...this.state, ...this.nextState };

    const updated = !Comparer.compareDeep(tmpState, currentState);

    if (updated) {
      this.nextState = tmpState;

      return await this.startUpdated();
    }
  }

  // override, add logic before returning

  async startUpdated() {
    return await this.waitUpdated();
  }

  // returned by startUpdated to wait for a promise

  waitUpdated() {
    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  // move nextState to state

  replaceUpdated() {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  resolveUpdated() {
    /*
    
    resolvers run in a microtask because of the nature of Promises

    the order will be:

    update event
    promise

    */

    this.updateResolvers.forEach((resolve) => resolve());

    this.updateResolvers = [];
  }
}

module.exports = Stateful;
