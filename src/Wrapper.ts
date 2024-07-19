import $, {
  Attributes,
  ClassComponent,
  ComponentType,
  PropsNoChildren,
} from "./Slot";

import { Component, Props } from "./Component";
import { Comparer } from "./Comparer";
import { Context } from "./Context";
import { State } from "./Stateful";

export class Wrapper {
  static wrapProps<A extends Props, B>(
    Child: ComponentType<A & B>,
    closure: (props: PropsNoChildren<A>) => B | null
  ) {
    return function PropsWrapper({ children, ...props }: A) {
      const result = closure(props);

      if (result === null) {
        return null;
      }

      const tmpProps = { ...props, ...result };

      return $(Child, tmpProps as Attributes<A & B>, children);
    };
  }

  static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    context: Context<State>,
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A>;
  static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    contexts: Context<State>[],
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A>;
  static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    tmpContexts: Context<State> | Context<State>[],
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A> {
    const contexts = Array.isArray(tmpContexts) ? tmpContexts : [tmpContexts];

    return class ContextWrapper extends Component<A, State> {
      result: B | null = null;

      compareTimeout: number | undefined;

      constructor(props: A) {
        super(props);

        this.on("mount", this.handleMountContext);
        this.on("unmount", this.handleUnmountContext);
      }

      compareListener = () => {
        clearTimeout(this.compareTimeout);

        this.compareTimeout = setTimeout(() => this.compare());
      };

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
        return selectors.reduce<Partial<B> | null>((result, selector) => {
          if (result === null) {
            return null;
          }

          const { children, ...props } = this.props;

          const tmpProps = { ...props, ...result };

          const tmpResult = selector(tmpProps);

          if (tmpResult === null) {
            return null;
          }

          const mergedResult = { ...result, ...tmpResult };

          return mergedResult;
        }, {}) as B | null;
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

        const tmpProps = { ...props, ...this.result };

        return $(Child, tmpProps as Attributes<A & B>, children);
      }
    };
  }
}
