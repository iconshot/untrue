import { Component, Props } from "./Component";
import { Context } from "./Context";
import { Emitter } from "./Emitter";
import { ClassComponent } from "./Node";
import { State } from "./Stateful";

export interface StorageInterface {
  getItem(key: string): any | Promise<any>;
  setItem(key: string, value: any): void | Promise<void>;
}

export type ContextsObject = { [key: string]: Context<any> };

type StorageContent = { data: { [key: string]: any }; version: number };

export type MigrationsObject = {
  [key: number]: (value: { [key: string]: any }) => { [key: string]: any };
};

export type PersistorOptions = {
  name?: string;
  version?: number;
  migrations?: MigrationsObject;
};

interface PersistorProviderProps extends Props {
  loadingChildren?: any[];
  errorChildren?: any[];
}

interface PersistorProviderState extends State {
  loading: boolean;
  error: boolean;
}

export class Persistor extends Emitter {
  contexts: ContextsObject;
  Storage: StorageInterface;

  name: string;
  version: number;
  migrations: MigrationsObject;

  Provider: ClassComponent<PersistorProviderProps>;

  persistTimeout: number | undefined;

  constructor(
    contexts: ContextsObject,
    Storage: StorageInterface,
    options?: PersistorOptions
  ) {
    super();

    this.Storage = Storage;

    this.contexts = contexts;

    this.name = options?.name ?? "app"; // name of the Storage item
    this.version = options?.version ?? 0; // content version of the Storage item
    this.migrations = options?.migrations ?? {};

    const self = this;

    this.Provider = class PersistorProvider extends Component<
      PersistorProviderProps,
      PersistorProviderState
    > {
      constructor(props: PersistorProviderProps) {
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
        const {
          loadingChildren = null,
          errorChildren = null,
          children,
        } = this.props;

        const { loading, error } = this.state;

        if (error) {
          return errorChildren;
        }

        if (loading) {
          return loadingChildren;
        }

        return children;
      }
    };
  }

  persistListener = () => {
    clearTimeout(this.persistTimeout);

    this.persistTimeout = setTimeout(() => this.persist());
  };

  // init() is called when the Provider is mounted

  async init() {
    // content can be null when there's not an item found with the name this.name in Storage

    const content = await this.read();

    let data: StorageContent["data"] = {};

    if (content !== null) {
      data = this.migrate(content.data, content.version);
    }

    for (const key in this.contexts) {
      const context = this.contexts[key];

      // start listening to updates

      context.on("update", this.persistListener);

      if (key in data) {
        // hydrate context with the corresponding data

        const value = data[key];

        context.hydrate(value);
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
    const content: StorageContent = { data: {}, version: this.version };

    for (const key in this.contexts) {
      const context = this.contexts[key];

      content.data[key] = context.persist();
    }

    await this.write(content);
  }

  async read() {
    // if found, content is read as JSON

    const { Storage } = this;

    const value: string | null = await Storage.getItem(this.name);

    const content: StorageContent | null =
      value !== null ? JSON.parse(value) : null;

    return content;
  }

  async write(content: StorageContent) {
    // content is written as a json

    const { Storage } = this;

    const value = JSON.stringify(content);

    await Storage.setItem(this.name, value);
  }

  // get versions from current version (exclusive) to this.version (inclusive)

  migrate(data: StorageContent["data"], version: number) {
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
