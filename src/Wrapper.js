import Node from "./Node.js";
import Component from "./Component.js";
import Comparer from "./Comparer.js";

class Wrapper {
  static wrapProps(Child, closure) {
    // create a PropsWrapper function component

    return function PropsWrapper({ children, ...props }) {
      let result = {};

      try {
        result = closure(props);
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
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

      // returned result will be merged with props and passed to Child

      select() {
        try {
          return selectors.reduce((result, selector) => {
            const newProps = { ...this.props, ...result };

            const newResult = selector(newProps);

            return { ...result, ...newResult };
          }, {});
        } catch (error) {
          queueMicrotask(() => {
            throw error;
          });

          return null;
        }
      }

      populate() {
        const result = this.select();

        if (result === null) {
          return;
        }

        this.result = result;
      }

      compare() {
        const result = this.select();

        if (result === null) {
          return;
        }

        const updated = !Comparer.compareDeep(result, this.result);

        if (updated) {
          this.update();
        }
      }

      render() {
        const { children, ...props } = this.props;

        this.populate(); // needed so we handle both update() calls and new props

        return new Node(Child, { ...props, ...this.result }, children);
      }
    };
  }
}

export default Wrapper;
