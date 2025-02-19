import $, {
  Slot,
  Attributes,
  ClassComponent,
  ComponentType,
  PropsNoChildren,
} from "./Slot";

import { Comparer } from "./Comparer";

import { State } from "./Stateful/Stateful";
import { Component, Props } from "./Stateful/Component";
import { Context } from "./Stateful/Context";
import { UpdatePromise } from "./Stateful/UpdatePromise";

class PublicComponent<K extends Props, L extends State> extends Component<
  K,
  L
> {
  public props: K;
  public prevProps: K | null = null;
  public nextProps: K | null = null;

  public state: L;
  public prevState: L | null = null;
  public nextState: L | null = null;

  public mounted: boolean = false;

  public override update(): UpdatePromise {
    return super.update();
  }

  public override updateState(state: Partial<L>): UpdatePromise {
    return super.updateState(state);
  }
}

export class Wrapper {
  public static wrapComponent<K extends Props = Props, L extends State = State>(
    initClosure: (
      self: PublicComponent<K, L>
    ) => ((props: K, state: L) => any) | null | void
  ): ClassComponent<K> {
    return class ComponentWrapper extends PublicComponent<K, L> {
      private renderClosure: ((props: K, state: L) => any) | null = null;

      public override init(): void {
        this.renderClosure = initClosure(this) ?? null;
      }

      public override render(): any {
        if (this.renderClosure === null) {
          return null;
        }

        return this.renderClosure(this.props, this.state);
      }
    };
  }

  public static wrapProps<A extends Props, B>(
    Child: ComponentType<A & B>,
    callback: (props: PropsNoChildren<A>) => B | null
  ): (props: A) => Slot<A & B> | null {
    return function PropsWrapper({ children, ...props }: A) {
      const result = callback(props);

      if (result === null) {
        return null;
      }

      const tmpProps = { ...props, ...result };

      return $(Child, tmpProps as Attributes<A & B>, children);
    };
  }

  public static wrapContext<A extends Props, B>(
    Child: ComponentType<A & B>,
    context: Context | Context[],
    ...selectors: ((
      props: PropsNoChildren<A> & Partial<B>
    ) => Partial<B> | null)[]
  ): ClassComponent<A> {
    const contexts = Array.isArray(context) ? context : [context];

    return class ContextWrapper extends Component<A> {
      private result: B | null = null;

      public override init(): void {
        let timeout: number | undefined;

        const listener = (): void => {
          clearTimeout(timeout);

          timeout = setTimeout((): void => this.compare());
        };

        this.on("mount", (): void => {
          for (const context of contexts) {
            context.on("update", listener);
          }
        });

        this.on("unmount", (): void => {
          for (const context of contexts) {
            context.off("update", listener);
          }
        });
      }

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

      public override render(): any {
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
