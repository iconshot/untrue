import EventEmitter from "eventemitter3";

import Component from "./Component.js";

class Persistor extends EventEmitter {
  constructor(
    contexts,
    Storage,
    { name = "app", version = 0, migrations = {} } = {}
  ) {
    super();

    this.Storage = Storage;

    this.contexts = contexts;

    this.name = name; // name of the Storage item
    this.version = version; // content version of the Storage item

    this.migrations = migrations;

    const self = this;

    this.Provider = class PersistorProvider extends Component {
      constructor(props) {
        super(props);

        this.state = { loading: true, error: false };

        // init the Persistor on mount

        this.on("mount", async () => {
          try {
            await self.init();
          } catch (error) {
            this.updateState({ error: true });

            throw error;
          } finally {
            this.updateState({ loading: false });
          }
        });
      }

      render() {
        const { loadingNode = null, errorNode = null, children } = this.props;

        const { loading, error } = this.state;

        if (error) {
          return errorNode;
        }

        if (loading) {
          return loadingNode;
        }

        return children;
      }
    };

    // multiple consecutive updates in contexts will be batched in a single call to persist()

    this.persistTimeout = null;

    this.persistListener = () => {
      clearTimeout(this.persistTimeout);

      this.persistTimeout = setTimeout(() => this.persist());
    };
  }

  // init() is called when the Provider is mounted

  async init() {
    // content can be null when there's not an item found with the name this.name in Storage

    const content = await this.read();

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
    so the Storage item's data replicates the contexts state from the beginning

    */

    await this.persist();

    this.emit("init");
  }

  // generate the content for the Storage item and write it

  async persist() {
    const content = { data: {}, version: this.version };

    for (const key in this.contexts) {
      const context = this.contexts[key];

      content.data[key] = context.persist();
    }

    await this.write(content);
  }

  async read() {
    // if found, content is read as a JSON

    const { Storage } = this;

    const value = await Storage.getItem(this.name);

    const content = value !== null ? JSON.parse(value) : null;

    return content;
  }

  async write(content) {
    // content is written as a json

    const { Storage } = this;

    const value = JSON.stringify(content);

    await Storage.setItem(this.name, value);
  }

  // get versions from current version (exclusive) to this.version (inclusive)

  migrate(data, version) {
    // already sorted by JS

    const keys = Object.keys(this.migrations)
      .map((key) => parseInt(key))
      .filter((key) => key > version && key <= this.version);

    // migrate data

    return keys.reduce((value, key) => {
      const migrate = this.migrations[key];

      return migrate(value);
    }, data);
  }
}

export default Persistor;
