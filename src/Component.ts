import { Stateful, State, StatefulSignatures } from "./Stateful";

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

  constructor(props: K) {
    super();

    this.props = props;

    this.init();
  }

  // triggerRender will be called by a renderer abstraction

  public triggerRender(handler: () => void): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    this.emit("render");

    self.off("rerender");

    self.on("rerender", handler);

    if (!this.mounted) {
      this.triggerMount();
    } else {
      this.triggerUpdate();
    }
  }

  private triggerMount(): void {
    this.mounted = true;

    this.emit("mount");
  }

  public triggerUnmount(): void {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.off("rerender");

    this.mounted = false;

    this.emit("unmount");
  }

  // the component will receive a "rerender" handler via triggerRender

  protected async startUpdate(): Promise<void> {
    const self = this as Stateful<L, AllComponentSignatures>;

    self.emit("rerender");
  }

  public updateProps(props: K): void {
    this.nextProps = props;

    this.performUpdate();
  }

  protected performUpdate(): void {
    super.performUpdate();

    clearTimeout(this.updateTimeout);
  }

  protected replaceUpdate(): void {
    super.replaceUpdate();

    this.prevProps = this.props;

    if (this.nextProps !== null) {
      this.props = this.nextProps;
    }

    this.nextProps = null;
  }

  public render(): any {
    return [];
  }
}

export default Component;
