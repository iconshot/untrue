import { Stateful, State } from "./Stateful";

export interface Props {
  children: any[];
}

export class Component<
  K extends Props = Props,
  L extends State = State
> extends Stateful<L> {
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
    this.emit("render");

    this.off("rerender");

    this.on("rerender", handler);

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
    this.off("rerender");

    this.mounted = false;

    this.emit("unmount");
  }

  // the component will receive a "rerender" handler via triggerRender

  protected async queueUpdate(): Promise<void> {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout((): void => {
      this.emit("rerender");
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
