const Stateful = require("./Stateful");

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

  updateProps(props) {
    this.nextProps = props;
  }

  // the component will receive a "rerender" handler via triggerRender

  async startUpdated() {
    clearTimeout(this.updateTimeout);

    this.updateTimeout = setTimeout(() => this.emit("rerender"));

    return await super.startUpdated();
  }

  // move nextState and nextProps to state and props respectively

  replaceUpdated() {
    super.replaceUpdated();

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

module.exports = Component;
