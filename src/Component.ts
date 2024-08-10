import { Stateful, State, StatefulSignatures } from "./Stateful";

export interface Props {
  children: any[];
}

type ComponentSignatures = StatefulSignatures & {
  render: () => any;
  mount: () => any;
  unmount: () => any;
};

type PrivateComponentSignatures = StatefulSignatures & {
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
  }

  // triggerRender will be called by a renderer abstraction

  triggerRender(handler: () => void): void {
    const self = this as Stateful<L, PrivateComponentSignatures>;

    this.emit("render");

    self.off("rerender");

    self.on("rerender", handler);

    if (!this.mounted) {
      this.triggerMount();
    } else {
      this.triggerUpdate();
    }
  }

  protected triggerMount(): void {
    this.mounted = true;

    this.emit("mount");
  }

  triggerUnmount(): void {
    const self = this as Stateful<L, PrivateComponentSignatures>;

    self.off("rerender");

    this.mounted = false;

    this.emit("unmount");
  }

  // the component will receive a "rerender" handler via triggerRender

  protected async queueUpdate(): Promise<void> {
    const self = this as Stateful<L, PrivateComponentSignatures>;

    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => {
      self.emit("rerender");
    });

    return await super.queueUpdate();
  }

  updateProps(props: K): void {
    this.nextProps = props;

    this.startUpdate();
  }

  protected startUpdate(): void {
    super.startUpdate();

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

  render(): any {
    return [];
  }
}

export default Component;
