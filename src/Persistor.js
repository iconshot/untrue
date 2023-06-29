import { Component } from "./Component";
import { Context } from "./Context";
import { Wrapper } from "./Wrapper";

export class Persistor extends Context {
  constructor({ name = "app", version = 0, contexts = {}, migrations = {} }) {
    super();

    // "loaded" is used by the Provider

    this.state = { loaded: false };

    this.name = name; // name of the localStorage item

    this.version = version;
    this.contexts = contexts;

    // migrations are sorted in migrate()

    this.migrations = migrations;

    const self = this;

    this.Provider = Wrapper.wrapContext(
      class PersistorProvider extends Component {
        constructor(props) {
          super(props);

          // init the Persistor on mount

          this.on("mount", () => self.init());
        }

        render() {
          const { loaded, loadingNode, children } = this.props;

          return !loaded ? loadingNode : children;
        }
      },
      self,
      () => {
        const { loaded } = self.getState();

        return { loaded };
      }
    );

    // multiple consecutive updates in contexts will be batched in a single call to persist()

    this.persistTimeout = null;

    this.persistListener = () => {
      clearTimeout(this.persistTimeout);

      this.persistTimeout = setTimeout(() => {
        this.persist();
      });
    };
  }

  // init() is called when the Provider is mounted

  init() {
    // content can be null when there's not an item found with the name this.name in localStorage

    const content = this.read();

    let data = {};

    if (content !== null) {
      data = this.migrate(content.data, content.version);
    }

    for (const key in this.contexts) {
      const context = this.contexts[key];

      // start listening to updates

      context.on("update", this.persistListener);

      if (key in data) {
        // hydrate context with the corresponding data

        context.hydrate(data[key]);
      }
    }

    /*
    
    even if there's no updates yet, we write the content,
    so the localStorage item's data replicates the contexts state from the beginning

    */

    this.persist();

    // update state so Provider knows when to render the tree

    this.updateState({ loaded: true });
  }

  // generate the content for the localStorage's item and write it

  persist() {
    const content = { data: {}, version: this.version };

    for (const key in this.contexts) {
      const context = this.contexts[key];

      content.data[key] = context.persist();
    }

    this.write(content);
  }

  read() {
    // if found, content is read as a JSON

    const value = window.localStorage.getItem(this.name);

    const content = value !== null ? JSON.parse(value) : null;

    return content;
  }

  write(content) {
    // content is written as a json

    const value = JSON.stringify(content);

    window.localStorage.setItem(this.name, value);
  }

  migrate(data, version) {
    // get versions from current version (exclusive) to this.version (inclusive)

    const keys = Object.keys(this.migrations)
      .filter((key) => key > version && key <= this.version)
      .sort((a, b) => a - b);

    // migrate data

    return keys.reduce((value, key) => {
      const migrate = this.migrations[key];

      return migrate(value);
    }, data);
  }
}
