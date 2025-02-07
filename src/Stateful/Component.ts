import { Stateful, State, StatefulSignatures } from "./Stateful";
import { UpdatePromise } from "./UpdatePromise";

export interface Props {
  children: any[];
}

type ComponentSignatures = StatefulSignatures & {
  mount: () => any;
  unmount: () => any;
  render: () => any;
};

type AllComponentSignatures = ComponentSignatures & {
  rerender: () => any;
};

export class Component<
  K extends Props = Props,
  L extends State = State
> extends Stateful<L, ComponentSignatures> {
  protected props: K;

  protected prevProps: K | null = null;
  protected nextProps: K | null = null;

  protected mounted: boolean = false;
  protected unmounted: boolean = false;

  constructor(props: K) {
    super();

    this.props = props;
  }

  public initialize(listener: () => void): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.on("rerender", listener);

    this.init();
  }

  public init(): void {}

  // override update

  protected override update(): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    return super.update();
  }

  protected override updateState(state: Partial<L>): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    return super.updateState(state);
  }

  // the component will receive a "rerender" listener via finishRender

  protected override startUpdate(): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.emit("rerender");
  }

  public updateProps(props: K): void {
    this.nextProps = props;

    this.performUpdate();
  }

  protected override replaceUpdate(): void {
    super.replaceUpdate();

    this.prevProps = this.props;

    if (this.nextProps !== null) {
      this.props = this.nextProps;
    }

    this.nextProps = null;
  }

  /*
  
  finishRender will be called by a Tree abstraction

  we use a timeout for emitting the "render" event (and any other lifecycle events)
  to ensure the entire Tree render process is complete before performing actions on the DOM.

  this is important because some operations, like calling focus() on inputs or accessing offsetWidth,
  require all elements in the component tree to be fully rendered.

  for example:
  - suppose we have a flex item inside Component A.
  - when the "mount" lifecycle event for Component A is triggered, the subsequent flex items
    (possibly inside other components) might not yet be rendered by the Tree render process.
  - if we try to access the offsetWidth of the flex item in Component A immediately (without a timeout),
    we might get 0 because other flex items that affect its dimensions may not yet be rendered.

  by deferring these actions with a timeout, we ensure all dependent elements are rendered,
  allowing accurate measurements and interactions.

  */

  public finishRender(): void {
    if (!this.mounted) {
      this.finishMount();
    } else {
      this.finishUpdate();
    }

    setTimeout((): void => this.emit("render"));
  }

  private finishMount(): void {
    this.mounted = true;

    setTimeout((): void => this.emit("mount"));
  }

  public finishUnmount(): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.off("rerender");

    this.mounted = false;
    this.unmounted = true;

    setTimeout((): void => this.settleNextUpdate(false));

    setTimeout((): void => this.emit("unmount"));
  }

  public render(): any {}
}
