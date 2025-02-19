import { Stateful, State, StatefulSignatures } from "./Stateful";
import { UpdatePromise } from "./UpdatePromise";

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
}
