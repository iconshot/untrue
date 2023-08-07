import { EventEmitter } from "eventemitter3";

import { Comparer } from "./Comparer";

export class Context extends EventEmitter {
  constructor() {
    super();

    this.state = {};

    // consistent with Component

    this.prevState = null;
    this.nextState = null;

    /*

    batch consecutive updates

    unlike Component that relies on Tree to do the batching,
    Context will handle the batching itself 
    
    */

    this.updateTimeout = null;

    this.updateResolvers = []; // allows us to use await in update/updateState
  }

  getState() {
    return this.state;
  }

  // methods used by Persistor

  persist() {
    return this.state;
  }

  hydrate(state) {
    this.state = state;
  }

  /*
  
  since Context works independently from Tree,
  replaceUpdated() is called here to move nextState to state

  the rest is consistent to Component.triggerUpdate

  */

  triggerUpdate() {
    this.replaceUpdated();
    this.resolveUpdated();

    setTimeout(() => {
      this.emit("update");
    });
  }

  async update() {
    // batch consecutive update/updateState calls

    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => {
      this.triggerUpdate();
    });

    return await this.waitUpdated();
  }

  /*
  
  consistent with Component.updateState

  state won't be changed right away,
  but we will change a nextState property instead

  the state will be moved later on the replaceUpdated call inside triggerUpdate
  
  --

  for a handler like:

    await this.updateState({ counter: 1 });
    await this.updateState({ counter: 2 });

  the output will be:

    queue triggerUpdate
    triggerUpdate
    queue emit update
    queue triggerUpdate
    emit update
    Context update {counter: 1}
    triggerUpdate
    queue emit update
    emit update
    Context update {counter: 2}

  --

  for a handler like:

    this.updateState({ counter: 1 })

    setTimeout(() => {
      this.updateState({ counter: 2 })
    })

  the output will be:

    queue triggerUpdate
    queue timeout
    triggerUpdate
    queue emit update
    timeout
    queue triggerUpdate
    emit update
    Context update {counter: 1}
    triggerUpdate
    queue emit update
    emit update
    Context update {counter: 2}
  
  --

  for a handler like:

    setTimeout(() => {
      this.updateState({ counter: 2 });
    });

    this.updateState({ counter: 1 });

  the output will be:

    queue timeout
    queue triggerUpdate
    timeout
    queue triggerUpdate
    triggerUpdate
    queue emit update
    emit update
    Context update {counter: 2}

  */

  async updateState(state) {
    const tmpState = { ...this.state, ...this.nextState, ...state };

    const currentState = { ...this.state, ...this.nextState };

    const updated = !Comparer.compareDeep(tmpState, currentState);

    if (updated) {
      this.nextState = tmpState;

      return await this.update();
    }
  }

  waitUpdated() {
    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  // unlike Component, replaceUpdated will be called inside triggerUpdate

  replaceUpdated() {
    this.prevState = this.state;

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextState = null;
  }

  resolveUpdated() {
    // resolvers run in a microtask because of the nature of Promises

    this.updateResolvers.forEach((resolve) => resolve());

    this.updateResolvers = [];
  }
}
