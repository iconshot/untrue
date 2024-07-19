import { Component, Props } from "./Component";
import { Ref } from "./Ref";
import { State } from "./Stateful";

type DefaultProps = Props & { [key: string]: any };

export type ContentComponent<K extends Props> =
  | ClassComponent<K>
  | FunctionComponent<K>;

export type ClassComponent<K extends Props> = new (...args: any[]) => Component<
  K,
  State
>;

export type FunctionComponent<K extends Props> = (props: K) => any;

export type ContentType<K extends Props> = ContentComponent<K> | string;

export type PropsNoChildren<K extends Props> = Omit<K, "children">;

export type Attributes<K extends Props> = PropsNoChildren<
  K & { key?: any; ref?: Ref<any> }
>;

function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>
): Node<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>
): Node<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  children: any[]
): Node<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  attributes: Attributes<K>,
  children: any[]
): Node<K>;
function $<K extends Props = DefaultProps>(
  contentType: ContentType<K>,
  ...args
): Node<K> {
  let attributes: Attributes<K> | null = null;
  let children: any[] = [];

  switch (args.length) {
    case 0: {
      break;
    }

    case 1: {
      if (Array.isArray(args[0])) {
        children = args[0];
      } else if (args[0] instanceof Node) {
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
    throw new Error("Node type must be a Component class, function or string.");
  }

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    throw new Error("Node attributes must be object or null.");
  }

  return new Node(contentType, attributes, children);
}

export default $;

export class Node<K extends Props> {
  private contentType: ContentType<K> | null;
  private attributes: Attributes<K> | null;
  private children: any[];

  private propsChildren: any[] | null = null;

  constructor(
    contentType: ContentType<K> | null,
    attributes: Attributes<K> | null,
    children: any[]
  ) {
    children = Node.parseChildren(children);

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
    if (!Array.isArray(children)) {
      children = [children];
    }

    children = Node.parseChildren(children);

    this.children = children;
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

    new Node("div", null, [["a", "b"], "text"])

  the output will be:

    new Node("div", null, [new Node(null, null, ["a", "b"]), "text"])

  this way Tree won't have a problem traversing the sub-tree

  */

  static parseChildren(children: any[]) {
    return children.map((child) =>
      Array.isArray(child) ? new Node(null, null, child) : child
    );
  }
}