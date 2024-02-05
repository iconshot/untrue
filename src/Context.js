import Stateful from "./Stateful.js";

class Context extends Stateful {
  // methods used by Persistor

  persist() {
    return this.state;
  }

  hydrate(state) {
    this.state = state;
  }

  triggerUpdate() {
    this.prepareUpdate();

    super.triggerUpdate();
  }

  async startUpdate() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.triggerUpdate());

    return await super.startUpdate();
  }
}

export default Context;
