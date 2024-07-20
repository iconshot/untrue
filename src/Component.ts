import { Stateful, State } from "./Stateful";

export interface Props {
  children: any[];
}

export class Component<
  K extends Props = Props,
  L extends State = State
> extends Stateful<L> {
  props: K;

  prevProps: K | null = null;
  nextProps: K | null = null;

  mounted: boolean = false;

  constructor(props: K) {
    super();

    this.props = props;
  }

  // triggerRender will be called by a renderer abstraction

  triggerRender(handler: () => void) {
    this.emit("render");

    this.off("rerender");

    this.on("rerender", handler);

    if (!this.mounted) {
      this.triggerMount();
    } else {
      this.triggerUpdate();
    }
  }

  triggerMount() {
    this.mounted = true;

    this.emit("mount");
  }

  triggerUnmount() {
    this.off("rerender");

    this.mounted = false;

    this.emit("unmount");
  }

  // the component will receive a "rerender" handler via triggerRender

  async queueUpdate() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.emit("rerender"));

    return await super.queueUpdate();
  }

  updateProps(props: K) {
    this.nextProps = props;

    this.startUpdate();
  }

  startUpdate() {
    super.startUpdate();

    clearTimeout(this.updateTimeout);
  }

  replaceUpdate() {
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
