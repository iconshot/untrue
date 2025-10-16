import { ClassComponent, ComponentType } from "../Slot/Slot";
import $ from "../Slot/$";

import { Comparer } from "../Comparer";

import { Stateful, State, StatefulSignatures } from "./Stateful";
import { UpdatePromise } from "./UpdatePromise";
import { Component, Props } from "./Component";

export class Context<L extends State = State, M = any> extends Stateful<
  L,
  StatefulSignatures
> {
  public getState(): L {
    return this.state;
  }

  // methods used by Persistor

  public persist(): M | undefined {
    return undefined;
  }

  public hydrate(value: M): void {}

  // override update

  public override update(): UpdatePromise {
    return super.update();
  }

  public override updateState(state: Partial<L>): UpdatePromise {
    return super.updateState(state);
  }

  /*

  in Component, the startUpdate will emit a "rerender" event for the tree
  and then the Tree will separate performUpdate (updateProps) from finishUpdate (finishRender)
  because that's how it needs to work,

  in Context, however, we don't depend on a Tree
  so we do everything in startUpdate

  basically once we reach startUpdate,
  the update may be performed and finished successfully

  */

  protected override startUpdate(): void {
    this.performUpdate();
    this.finishUpdate();
  }

  /*

  we need to create a timeout before emitting "update"  
  to ensure proper ordering of update events.

  why?
  - if an "update" listener triggers an update or updateState call,  
    the startUpdate() for that new update must happen **after** the "lateUpdate"  
    event has been emitted for the initial update.
  - if we don't handle this correctly, startUpdate() for the second update  
    could run **before** the initial "lateUpdate" event is fully processed.  
  - this would result in "lateUpdate" listeners seeing a different state  
    than what was present during the initial "update" event.

  by setting the timeout before emitting "update,"  
  we ensure updates are processed in the correct order.

  */

  private finishUpdate(): void {
    setTimeout((): void => {
      this.settleUpdate(true);

      this.emit("lateUpdate");
    });

    this.emit("update");
  }

  public static wrap<A extends Props, U extends keyof A>(
    Child: ComponentType<A>,
    context: Context | Context[],
    selector: (props: Omit<A, U | "children">) => Pick<A, U> | null
  ): ClassComponent<Props & Omit<A, U>> {
    const contexts = Array.isArray(context) ? context : [context];

    return class ContextWrapper extends Component<Props & Omit<A, U>> {
      private result: Pick<A, U> | null = null;

      public override init(): void {
        let timeout: number | undefined;

        const listener = (): void => {
          clearTimeout(timeout);

          timeout = setTimeout((): void => {
            this.compare();
          }) as unknown as number;
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

      private select(): Pick<A, U> | null {
        const { children, ...props } = this.props;

        return selector(props as any);
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

        return $(Child, tmpProps as any, children);
      }
    };
  }
}
