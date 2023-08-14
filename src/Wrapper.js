const Node = require("./Node");
const Component = require("./Component");
const Comparer = require("./Comparer");

class Wrapper {
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

    return class ContextWrapper extends Component {
      constructor(props) {
        super(props);

        this.result = {}; // result returned by this.select()

        this.on("mount", this.handleMountContext);
        this.on("unmount", this.handleUnmountContext);

        // multiple consecutive updates in contexts will be batched in a single call to compare()

        this.compareTimeout = null;

        this.compareListener = () => {
          clearTimeout(this.compareTimeout);

          this.compareTimeout = setTimeout(() => this.compare());
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

          const updated = !Comparer.compareDeep(result, this.result);

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

module.exports = Wrapper;
