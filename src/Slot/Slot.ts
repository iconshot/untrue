import { Component, Props } from "../Stateful/Component";
import { State } from "../Stateful/Stateful";

import { Ref } from "../Ref";

export type ClassComponent<
  K extends Props = Props,
  L extends State = State
> = new (props: K) => Component<K, L>;

export type FunctionComponent<K extends Props = Props> = (
  props: K,
  prevProps?: K | null
) => any;

export type ComponentType<K extends Props = Props> =
  | ClassComponent<K>
  | FunctionComponent<K>;

export type ContentType = ComponentType | string | null;

export type Children =
  | boolean
  | number
  | string
  | any[]
  | null
  | undefined
  | Slot;

export type PropsNoChildren<K extends Props> = Omit<K, "children">;

export type SlotAttributes = Record<string, any>;

export class Slot {
  private contentType: ContentType;
  private attributes: SlotAttributes | null;
  private children: any[];

  private propsChildren: any[] | null = null;

  constructor(
    contentType: ContentType,
    attributes: SlotAttributes | null,
    children: any[]
  ) {
    children = Slot.parseChildren(children);

    this.contentType = contentType;
    this.attributes = attributes;

    if (this.isClass() || this.isFunction()) {
      this.propsChildren = children;

      children = [];
    }

    this.children = children;
  }

  public getContentType(): ContentType {
    return this.contentType;
  }

  public getAttributes(): SlotAttributes | null {
    return this.attributes;
  }

  public getChildren(): any[] {
    return this.children;
  }

  public getPropsChildren(): any[] | null {
    return this.propsChildren;
  }

  public setChildren(children: any): void {
    let tmpChildren = Array.isArray(children) ? children : [children];

    tmpChildren = Slot.parseChildren(tmpChildren);

    this.children = tmpChildren;
  }

  public isClass(): boolean {
    const tmpContentType = this.contentType as any;

    return (
      tmpContentType !== null &&
      (tmpContentType.prototype === Component ||
        tmpContentType.prototype instanceof Component)
    );
  }

  public isFunction(): boolean {
    return typeof this.contentType === "function" && !this.isClass();
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

    const { key } = this.attributes;

    return key ?? null;
  }

  public getRef(): Ref<any> | null {
    if (this.attributes === null) {
      return null;
    }

    const { ref } = this.attributes;

    if (!(ref instanceof Ref)) {
      return null;
    }

    return ref;
  }

  public getProps(): SlotAttributes {
    const { key, ref, ...tmpAttributes } = this.attributes ?? {};

    const children = this.propsChildren ?? [];

    const props = { ...tmpAttributes, children };

    return props;
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
