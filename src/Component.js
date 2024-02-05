import Stateful from "./Stateful.js";

class Component extends Stateful {
  constructor(props = {}) {
    super();

    this.props = props;

    this.prevProps = null;
    this.nextProps = null;

    this.mounted = false;
  }

  // triggerRender will be called by a renderer abstraction

  triggerRender(handler) {
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

  async startUpdate() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.emit("rerender"));

    return await super.startUpdate();
  }

  prepareUpdate(props) {
    this.nextProps = props;

    clearTimeout(this.updateTimeout);

    super.prepareUpdate();
  }

  replaceUpdate() {
    super.replaceUpdate();

    this.prevProps = this.props;

    if (this.nextProps !== null) {
      this.props = this.nextProps;
    }

    this.nextProps = null;
  }

  render() {
    return [];
  }
}

export default Component;
