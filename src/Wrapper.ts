import $, {
  Slot,
  Attributes,
  ClassComponent,
  ComponentType,
  PropsNoChildren,
} from "./Slot";

import { Component, Props } from "./Component";
import { Comparer } from "./Comparer";
import { Context } from "./Context";

export class Wrapper {
  static wrapProps<A extends Props, B>(
    Child: ComponentType<A & B>,
    closure: (props: PropsNoChildren<A>) => B | null
  ): (props: A) => Slot<A & B> | null {
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
    context: Context,
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A>;
  static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    contexts: Context[],
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A>;
  static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    tmpContexts: Context | Context[],
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A> {
    const contexts = Array.isArray(tmpContexts) ? tmpContexts : [tmpContexts];

    return class ContextWrapper extends Component<A> {
      private result: B | null = null;

      private compareTimeout: number | undefined;

      constructor(props: A) {
        super(props);

        this.on("mount", this.handleMount);
        this.on("unmount", this.handleUnmount);
      }

      private compareListener = (): void => {
        clearTimeout(this.compareTimeout);

        this.compareTimeout = setTimeout((): void => {
          this.compare();
        });
      };

      private handleMount = (): void => {
        for (const context of contexts) {
          context.on("update", this.compareListener);
        }
      };

      private handleUnmount = (): void => {
        for (const context of contexts) {
          context.off("update", this.compareListener);
        }
      };

      // returned result will be merged with props and passed to Child

      private select(): B | null {
        return selectors.reduce<Partial<B> | null>(
          (result, selector): Partial<B> | null => {
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
          },
          {}
        ) as B | null;
      }

      private compare(): void {
        const result = this.select();

        const equal = Comparer.compare(result, this.result);

        if (equal) {
          return;
        }

        this.update();
      }

      render(): any {
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
