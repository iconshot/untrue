const Stateful = require("./Stateful");

class Context extends Stateful {
  // methods used by Persistor

  persist() {
    return this.state;
  }

  hydrate(state) {
    this.state = state;
  }

  triggerUpdate() {
    this.replaceUpdated();

    super.triggerUpdate();
  }

  async startUpdated() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.triggerUpdate());

    return await super.startUpdated();
  }
}

module.exports = Context;
