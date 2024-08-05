import { Component, Props } from "./Component";
import { Context } from "./Context";
import { Emitter } from "./Emitter";
import { Children, ClassComponent } from "./Slot";
import { State } from "./Stateful";

export interface StorageInterface {
  getItem(key: string): (string | null) | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
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

export interface PersistorProviderProps extends Props {
  loadingChildren?: Children;
  errorChildren?: Children;
}

interface PersistorProviderState extends State {
  loading: boolean;
  error: boolean;
}

type PersistorSignatures = {
  init: () => any;
};

export class Persistor extends Emitter<PersistorSignatures> {
  private contexts: ContextsObject;
  private Storage: StorageInterface;

  private name: string;
  private version: number;
  private migrations: MigrationsObject;

  Provider: ClassComponent<PersistorProviderProps>;

  private persistTimeout: number | undefined;

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

        this.on("mount", this.handleMount);
      }

      private handleMount = async (): Promise<void> => {
        try {
          await self.init();
        } catch (error) {
          this.updateState({ error: true });

          throw error;
        } finally {
          this.updateState({ loading: false });
        }
      };

      render(): any {
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

  private persistListener = (): void => {
    clearTimeout(this.persistTimeout);

    this.persistTimeout = setTimeout((): void => {
      this.persist();
    });
  };

  // init() is called when the Provider is mounted

  async init(): Promise<void> {
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

  private async persist(): Promise<void> {
    const content: StorageContent = { data: {}, version: this.version };

    for (const key in this.contexts) {
      const context = this.contexts[key];

      content.data[key] = context.persist();
    }

    await this.write(content);
  }

  private async read(): Promise<StorageContent | null> {
    // if found, content is read as JSON

    const { Storage } = this;

    const value: string | null = await Storage.getItem(this.name);

    const content: StorageContent | null =
      value !== null ? JSON.parse(value) : null;

    return content;
  }

  private async write(content: StorageContent): Promise<void> {
    // content is written as a json

    const { Storage } = this;

    const value = JSON.stringify(content);

    await Storage.setItem(this.name, value);
  }

  // get versions from current version (exclusive) to this.version (inclusive)

  private migrate(
    data: StorageContent["data"],
    version: number
  ): {
    [key: string]: any;
  } {
    // already sorted by JS

    const keys = Object.keys(this.migrations)
      .map((key): number => parseInt(key))
      .filter((key): boolean => key > version && key <= this.version);

    // migrate data

    return keys.reduce(
      (
        value,
        key
      ): {
        [key: string]: any;
      } => {
        const migrate = this.migrations[key];

        return migrate(value);
      },
      data
    );
  }
}
