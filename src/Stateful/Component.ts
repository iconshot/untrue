import { Stateful, State, StatefulSignatures } from "./Stateful";
import { UpdatePromise } from "./UpdatePromise";

export interface Props {
  children: any[];
}

type ComponentSignatures = StatefulSignatures & {
  render: () => any;
  mount: () => any;
  unmount: () => any;
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

  public init(): void {}

  // override update

  protected update(): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    return super.update();
  }

  protected updateState(state: Partial<L>): UpdatePromise {
    if (this.unmounted) {
      return new UpdatePromise(false);
    }

    return super.updateState(state);
  }

  // the component will receive a "rerender" listener via triggerRender

  protected startUpdate(): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.emit("rerender");
  }

  public updateProps(props: K): void {
    this.nextProps = props;

    this.performUpdate();
  }

  protected replaceUpdate(): void {
    super.replaceUpdate();

    this.prevProps = this.props;

    if (this.nextProps !== null) {
      this.props = this.nextProps;
    }

    this.nextProps = null;
  }

  // triggerRender will be called by a renderer abstraction

  public triggerRender(listener: () => void): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.off("rerender");

    self.on("rerender", listener);

    if (!this.mounted) {
      this.triggerMount();
    } else {
      this.triggerUpdate();
    }

    this.emit("render");
  }

  private triggerMount(): void {
    this.mounted = true;

    this.emit("mount");
  }

  public triggerUnmount(): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.off("rerender");

    this.mounted = false;
    this.unmounted = true;

    this.settleNextUpdate(false);

    this.emit("unmount");
  }

  public render(): any {
    return [];
  }
}

export default Component;
