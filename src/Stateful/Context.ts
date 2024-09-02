import { Stateful, State, StatefulSignatures } from "./Stateful";

export class Context<L extends State = State> extends Stateful<
  L,
  StatefulSignatures
> {
  public getState(): L {
    return this.state;
  }

  // methods used by Persistor

  public persist(): any {
    const value = this.state;

    return value;
  }

  public hydrate(value: any): void {
    this.state = value;
  }

  /*

  in Component, the startUpdate will emit a "rerender" event for the tree
  and then the Tree will separate performUpdate (updateProps) from triggerUpdate (triggerRender)
  because that's how it needs to work,

  in Context, however, we don't depend on a Tree
  so we do everything in startUpdate

  basically once we reach startUpdate,
  the update may be performed and finished successfully

  */

  protected startUpdate(): void {
    this.performUpdate();

    this.triggerUpdate();
  }
}
