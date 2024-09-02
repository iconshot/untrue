import { Ref } from "./Ref";

import { Component, Props } from "./Stateful/Component";

export type ClassComponent<K extends Props = Props> = new (
  props: K
) => Component<K>;

export type FunctionComponent<K extends Props = Props> = (props: K) => any;

export type ComponentType<K extends Props = Props> =
  | ClassComponent<K>
  | FunctionComponent<K>;

export type ContentType<K extends Props> = ComponentType<K> | string | null;

export type PropsNoChildren<K extends Props> = Omit<K, "children">;

export type Attributes<K extends Props> = PropsNoChildren<
  K & { key?: any; ref?: Ref<any> | null }
>;

export type Children =
  | boolean
  | number
  | string
  | any[]
  | null
  | undefined
  | Slot;

type DefaultProps = Props & { [key: string]: any };

function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  children: Children
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>,
  children: Children
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  ...args: any[]
): Slot<K> {
  let attributes: Attributes<K> | null = null;
  let children: any[] = [];

  switch (args.length) {
    case 0: {
      break;
    }

    case 1: {
      if (Array.isArray(args[0])) {
        children = args[0];
      } else if (args[0] instanceof Slot) {
        children = [args[0]];
      } else if (args[0] !== null && typeof args[0] === "object") {
        attributes = args[0];
      } else {
        children = [args[0]];
      }

      break;
    }

    default: {
      attributes = args[0];

      children = Array.isArray(args[1]) ? args[1] : [args[1]];

      break;
    }
  }

  const tmpContentType: any = contentType;

  const isClass =
    typeof tmpContentType === "function" &&
    /^class\s/.test(Function.prototype.toString.call(tmpContentType));

  if (
    !(
      tmpContentType === null ||
      (isClass &&
        (tmpContentType.prototype === Component ||
          tmpContentType.prototype instanceof Component)) ||
      (!isClass && typeof tmpContentType === "function") ||
      typeof tmpContentType === "string"
    )
  ) {
    throw new Error(
      "Content type must be a Component class, function, string or null."
    );
  }

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    throw new Error("Attributes must be object or null.");
  }

  return new Slot(contentType, attributes, children);
}

export default $;

export class Slot<K extends Props = DefaultProps> {
  private contentType: ContentType<K>;
  private attributes: Attributes<K> | null;
  private children: any[];

  private propsChildren: any[] | null = null;

  constructor(
    contentType: ContentType<K>,
    attributes: Attributes<K> | null,
    children: any[]
  ) {
    children = Slot.parseChildren(children);

    const tmpContentType: any = contentType;

    if (
      tmpContentType !== null &&
      (tmpContentType.prototype === Component ||
        tmpContentType.prototype instanceof Component ||
        typeof tmpContentType === "function")
    ) {
      this.propsChildren = children;

      children = [];
    }

    this.contentType = contentType;
    this.attributes = attributes;
    this.children = children;
  }

  public getContentType(): ContentType<K> {
    return this.contentType;
  }

  public getAttributes(): Attributes<K> | null {
    return this.attributes;
  }

  public getChildren(): any[] {
    return this.children;
  }

  public setChildren(children: any): void {
    let tmpChildren = Array.isArray(children) ? children : [children];

    tmpChildren = Slot.parseChildren(tmpChildren);

    this.children = tmpChildren;
  }

  public isComponent(): boolean {
    const tmpContentType: any = this.contentType;

    return (
      tmpContentType !== null &&
      (tmpContentType.prototype === Component ||
        tmpContentType.prototype instanceof Component)
    );
  }

  public isFunction(): boolean {
    return typeof this.contentType === "function" && !this.isComponent();
  }

  public isElement(): boolean {
    return typeof this.contentType === "string";
  }

  public isNull(): boolean {
    return this.contentType === null;
  }

  public getKey(): any {
    if (this.attributes === null) {
      return null;
    }

    const { key = null } = this.attributes;

    return key;
  }

  public getRef(): Ref<any> | null {
    if (this.attributes === null) {
      return null;
    }

    const { ref = null } = this.attributes;

    return ref;
  }

  public getProps(): K {
    const { key, ref, ...tmpAttributes } = this.attributes ?? {};

    const children = this.propsChildren ?? [];

    const props = { ...tmpAttributes, children };

    return props as K;
  }

  /*
  
  method necessary for cases when we have arrays inside children:

    new Slot("div", null, [["a", "b"], "text"])

  the output will be:

    new Slot("div", null, [new Slot(null, null, ["a", "b"]), "text"])

  this way Tree won't have a problem traversing the sub-tree

  */

  private static parseChildren(children: any[]): any[] {
    return children.map((child, i): any => {
      if (child instanceof Slot) {
        const key = child.getKey();

        if (key !== null) {
          const index = children.findIndex((tmpChild): boolean => {
            if (!(tmpChild instanceof Slot)) {
              return false;
            }

            const tmpKey = tmpChild.getKey();

            return key === tmpKey;
          });

          if (index !== i) {
            throw new Error(`Repeated keys: ${key}`);
          }
        }
      }

      return Array.isArray(child) ? new Slot(null, null, child) : child;
    });
  }
}
