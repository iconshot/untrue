import { v4 as uuid } from "uuid";

import { Emitter } from "./Emitter";

export class Component extends Emitter {
  constructor(props = {}) {
    super();

    this.props = props;

    this.state = {};

    this.prevProps = null;
    this.prevState = null;

    /*
    
    nextState is used to batch consecutive updateState calls 

    any updateState call will change nextState

    replaceUpdated() will later move the nextState to state 

    */

    this.nextProps = null;
    this.nextState = null;

    this.updateId = null; // needed to know when a component is updated

    this.updateResolvers = []; // allows us to use await in update/updateState

    this.mounted = false;

    this.node = null;
  }

  getState() {
    return this.state;
  }

  getNode() {
    return this.node;
  }

  setNode(node) {
    this.node = node;
  }

  isMounted() {
    return this.mounted;
  }

  /*
  
  triggerRender will be called by Tree

  setTimeout calls are used among the trigger methods for consistency with triggerUpdate()
  which has a specific reason to use a setTimeout

  */

  triggerRender(handler) {
    setTimeout(() => {
      this.emit("render");
    });

    if (!this.isMounted()) {
      this.triggerMount(handler);
    }

    if (this.isUpdated()) {
      this.triggerUpdate();
    }
  }

  triggerMount(handler) {
    this.on("rerender", handler);

    this.mounted = true;

    setTimeout(() => {
      this.emit("mount");
    });
  }

  triggerUnmount() {
    this.off("rerender");

    this.mounted = false;

    setTimeout(() => {
      this.emit("unmount");
    });
  }

  /*

  setTimeout is needed because Tree.rerender() will be called again until it has 0 items in the stack

    constructor(...) {
      ...

      this.on('update', () => {
        this.updateState({ counter: 2 })
      })
    }

    onUpdate = async () => {
      await this.updateState({ counter: 1 }) <- initial
    }

  if we didn't have the setTimeout and there was an updateState inside an "update" event handler
  the component would be detected as updated in the second Tree.rerender() call

  this would be a clear problem if we were awaiting the initial updateState call
  because we would have two "update" events before resolving the promise

  this behavior is confusing,
  so to avoid that, we wrap the "update" event inside a setTimeout,
  meaning the "update" event will be fired after the Tree.rerender() has ended

  */

  triggerUpdate() {
    this.resolveUpdated();

    setTimeout(() => {
      this.emit("update");
    });
  }

  // force an update

  async update() {
    this.ensureUpdated();

    return await this.emitUpdated();
  }

  /*
  
  every call to updateProps will mark the component as updated

  --

  it's worthless to compare props and this.props
  because we have a special prop "children"

  if we had a comparison and a "children" prop like:

    children: [
      new Node("span", "hello")
    ]

  when comparing, props and this.props would always be detected as not equal
  because it would be a new Node every time

  this would lead to a hard to understand "update" event behavior
  
  by marking every component with new props as updated,
  we are telling untrue to emit an "update" every time there's a rerender of this component
  (even if it was caused by a parent component)

  */

  updateProps(props) {
    this.ensureUpdated();

    this.nextProps = props;
  }

  /*

  updateState doesn't perform updates in the state right away,
  it will change a nextState property instead

  updateState emits the "rerender" event in every changing updateState call,
  but Tree will group them into one

  --

  this means we can have multiple updateState calls with only one rerender:

    this.updateState({ counter: 1 })
    this.updateState({ counter: 2 })

  --

  this won't be the case if they are not consecutive:

    this.updateState({ counter: 1 })

    setTimeout(() => {
      this.updateState({ counter: 2 })
    })

  here it will execute the first updateState call
  and then the timeout
  (before the first "update" event,
  since the "update" event is fired inside a setTimeout also)

  so the order will be:

    queue Tree.rerender
    queue timeout
    Tree.rerender
    queue emit update
    timeout
    queue Tree.rerender
    emit update
    Component update {counter: 1}
    Tree.rerender
    queue emit update
    emit update
    Component update {counter: 2}

  we shouldn't worry about things getting complicated in this situation

  the Tree has already finished when the second updateState is called
  so this call will queue a new Tree.rerender,
  but since there's already an "update" event to fire,
  that will be executed first 

  if we had an updateState inside the "update" event
  it would be batched with the second updateState
  because that's what we have in the JS event queue

  this.on("update", () => {
    if (someCondition) {
      this.updateState({ counter: 3 })
    }
  })

  the "update" is fired at the end,
  so the state will be:
  
  { counter: 3 }

  --

  if, on the other side, we had something like:

    setTimeout(() => {
      this.updateState({ counter: 2 });
    });

    this.updateState({ counter: 1 });

  the order would be:

    queue timeout
    queue Tree.rerender
    timeout
    Tree.rerender
    queue emit update
    emit update
    Component update {counter: 2}

  the timeout is queued first
  then the updateState({ counter: 1 }) queues a Tree.rerender
  but it can't be executed since the timeout has been queued first

  we execute the timeout
  event though we reach Tree.queue because of the updateState, we won't queue a Tree.rerender
  because the component is already queued

  the Tree.render takes place

  the state would end up like:

  { counter: 2 }

  --

  if we had an scenario like:

    this.updateState({ counter: 1 }).then(() => {
      // promise resolved
    });

    setTimeout(() => {
      this.updateState({ counter: 2 });
    });

  due to the nature of promises and how they are resolved in a microtask,
  the promise will be resolved before the timeout execution

    queue Tree.rerender
    queue timeout
    Tree.rerender
    queue emit update
    promise resolved
    timeout
    queue Tree.rerender
    emit update
    Component update {counter: 1}
    Tree.rerender
    queue emit update
    emit update
    Component update {counter: 2}

  --

  the batching is found in Tree.queue()

  */

  async updateState(state) {
    const tmpState = { ...this.state, ...this.nextState, ...state };

    const currentState = { ...this.state, ...this.nextState };

    const updated = !this.compareDeep(tmpState, currentState);

    if (updated) {
      this.ensureUpdated();

      this.nextState = tmpState;

      return await this.emitUpdated();
    }
  }

  isUpdated() {
    return this.updateId !== null;
  }

  // mark component as updated

  ensureUpdated() {
    if (this.updateId === null) {
      this.updateId = uuid();
    }
  }

  async emitUpdated() {
    // Tree has passed a "rerender" event handler via triggerRender

    this.emit("rerender");

    return await this.waitUpdated();
  }

  waitUpdated() {
    // the resolvers are called inside resolveUpdated

    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
    });
  }

  // called by Tree to move nextProps and nextState

  replaceUpdated() {
    this.prevProps = this.props;
    this.prevState = this.state;

    if (this.nextProps !== null) {
      this.props = this.nextProps;
    }

    if (this.nextState !== null) {
      this.state = this.nextState;
    }

    this.nextProps = null;
    this.nextState = null;
  }

  resolveUpdated() {
    /*
    
    resolvers run in a microtask because of the nature of Promises
    so the caller will continue after the Tree.rerender is finished

    the order will be:

    promise
    "update" event

    it's safe to have an updateState after the promise,
    it would trigger a new Tree.rerender

      await this.updateState({ counter: 1 })

      this.updateState({ counter: 2 })

    and if we had an updateState call inside an "update" event handler,
    it would be batched with the second updateState call

    */

    this.updateResolvers.forEach((resolve) => resolve());

    // reset update properties

    this.updateResolvers = [];

    this.updateId = null;
  }

  render() {
    return [];
  }
}
