import { Component, Props } from "./Component";
import { Ref } from "./Ref";
import { State } from "./Stateful";

type DefaultProps = Props & { [key: string]: any };

export type ComponentType<K extends Props> =
  | ClassComponent<K>
  | FunctionComponent<K>;

export type ClassComponent<K extends Props> = new (props: K) => Component<
  K,
  State
>;

export type FunctionComponent<K extends Props> = (props: K) => any;

export type ContentType<K extends Props> = ComponentType<K> | string;

export type PropsNoChildren<K extends Props> = Omit<K, "children">;

export type Attributes<K extends Props> = PropsNoChildren<
  K & { key?: any; ref?: Ref<any> }
>;

export type ChildrenAny = boolean | number | string | any[] | null | undefined;

function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  children: ChildrenAny
): Slot<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>,
  children: ChildrenAny
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
    tmpContentType === null ||
    tmpContentType === undefined ||
    !(
      (isClass &&
        (tmpContentType.prototype === Component ||
          tmpContentType.prototype instanceof Component)) ||
      (!isClass && typeof tmpContentType === "function") ||
      typeof tmpContentType === "string"
    )
  ) {
    throw new Error("Slot type must be a Component class, function or string.");
  }

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    throw new Error("Slot attributes must be object or null.");
  }

  return new Slot(contentType, attributes, children);
}

export default $;

export class Slot<K extends Props = DefaultProps> {
  private contentType: ContentType<K> | null;
  private attributes: Attributes<K> | null;
  private children: any[];

  private propsChildren: any[] | null = null;

  constructor(
    contentType: ContentType<K> | null,
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

  getContentType() {
    return this.contentType;
  }

  getAttributes() {
    return this.attributes;
  }

  getChildren() {
    return this.children;
  }

  setChildren(children: any) {
    let tmpChildren = Array.isArray(children) ? children : [children];

    tmpChildren = Slot.parseChildren(tmpChildren);

    this.children = tmpChildren;
  }

  isComponent() {
    const tmpContentType: any = this.contentType;

    return (
      tmpContentType !== null &&
      (tmpContentType.prototype === Component ||
        tmpContentType.prototype instanceof Component)
    );
  }

  isFunction() {
    return typeof this.contentType === "function" && !this.isComponent();
  }

  isElement() {
    return typeof this.contentType === "string";
  }

  isNull() {
    return this.contentType === null;
  }

  getKey() {
    if (this.attributes === null) {
      return null;
    }

    const { key = null } = this.attributes;

    return key;
  }

  getRef() {
    if (this.attributes === null) {
      return null;
    }

    const { ref = null } = this.attributes;

    return ref;
  }

  getProps(): K {
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

  static parseChildren(children: any[]) {
    return children.map((child) =>
      Array.isArray(child) ? new Slot(null, null, child) : child
    );
  }
}
