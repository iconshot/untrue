import { Node } from "./Node";
import { Component } from "./Component";

export class Wrapper {
  static wrapProps(Child, closure) {
    // create a PropsWrapper function component

    return function PropsWrapper({ children, ...props }) {
      const result = closure(props);

      return new Node(Child, { ...props, ...result }, children);
    };
  }

  static wrapContext(Child, contexts, ...selectors) {
    if (!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    /*

    let's say we have a context handler like:

      await this.updateState({ counter: 1 });

      await this.updateState({ counter: 2 });

    the order will be:

      first updateState before
      queue triggerUpdate
      triggerUpdate
      queue emit update
      first updateState after
      second updateState before
      queue triggerUpdate
      emit update
      queue compare
      triggerUpdate
      queue emit update
      second updateState after
      compare
      queue Tree.rerender
      emit update
      queue compare
      Tree.rerender
      compare
      App update {counter: 2, children: Array(0)}
    
    even though compare() is called twice, only the first one will trigger a component update

    when we reach this.populate() (part of ContextWrapper.render) we have the two state changes already replaced (because of the triggerUpdate calls),
    so select() will return the final result that will be stored in this.result,
    therefore the second compare() will have the final value in this.result,
    meaning that when we compare shallowly result and this.result, they will be equal

    --

    for a handler like:

      this.updateState({ counter: 1 });

      setTimeout(() => {
        this.updateState({ counter: 2 });
      });

    the output will be:

      queue triggerUpdate
      queue timeout
      triggerUpdate
      queue emit update
      timeout
      queue triggerUpdate
      emit update
      queue compare
      triggerUpdate
      queue emit update
      compare
      queue Tree.rerender
      emit update
      queue compare
      Tree.rerender
      compare
      App update {counter: 2, children: Array(0)}

    --

    finally, for a handler like:

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
      queue compare
      compare
      queue Tree.rerender
      Tree.rerender
      App update {counter: 2, children: Array(0)}

      the second "queue triggerUpdate" will cancel the first one and requeue the call, so only one triggerUpdate is called

    */

    return class ContextWrapper extends Component {
      constructor(props) {
        super(props);

        this.result = {}; // result returned by this.select()

        this.on("mount", this.handleMountContext);
        this.on("unmount", this.handleUnmountContext);

        /*
        
        multiple consecutive updates in contexts will be batched in a single call to compare()

        consistent with Persistor.persistTimeout

        */

        this.compareTimeout = null;

        this.compareListener = () => {
          clearTimeout(this.compareTimeout);

          this.compareTimeout = setTimeout(() => {
            this.compare();
          });
        };
      }

      handleMountContext = () => {
        for (const context of contexts) {
          context.on("update", this.compareListener);
        }
      };

      handleUnmountContext = () => {
        for (const context of contexts) {
          context.off("update", this.compareListener);
        }
      };

      compare() {
        try {
          const result = this.select();

          const updated = !this.compareDeep(result, this.result);

          if (updated) {
            this.update();
          }
        } catch (error) {}
      }

      // returned result will be merged with props and passed to Child

      select() {
        return selectors.reduce((result, selector) => {
          const newProps = { ...this.props, ...result };

          const newResult = selector(newProps);

          return { ...result, ...newResult };
        }, {});
      }

      // try block is necessary for cases when a selector needs some data that is no longer part of the context's state

      populate() {
        try {
          this.result = this.select();
        } catch (error) {}
      }

      render() {
        const { children, ...props } = this.props;

        this.populate(); // needed so we handle both update() calls and new props

        return new Node(Child, { ...props, ...this.result }, children);
      }
    };
  }
}
