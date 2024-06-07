import Node from "./Node.js";
import Component from "./Component.js";
import Comparer from "./Comparer.js";

class Wrapper {
  static wrapProps(Child, closure) {
    // create a PropsWrapper function component

    return function PropsWrapper({ children, ...props }) {
      const result = closure(props);

      if (result === null) {
        return null;
      }

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

        this.result = null; // result returned by this.select()

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

      // returned result will be merged with props and passed to Child

      select() {
        return selectors.reduce((result, selector) => {
          if (result === null) {
            return null;
          }

          const newProps = { ...this.props, ...result };

          const newResult = selector(newProps);

          if (newResult === null) {
            return null;
          }

          return { ...result, ...newResult };
        }, {});
      }

      compare() {
        const result = this.select();

        const equal = Comparer.compare(result, this.result);

        if (equal) {
          return;
        }

        this.update();
      }

      render() {
        const { children, ...props } = this.props;

        this.result = this.select(); // it handles both update() calls and new props

        if (this.result === null) {
          return null;
        }

        return new Node(Child, { ...props, ...this.result }, children);
      }
    };
  }
}

export default Wrapper;
