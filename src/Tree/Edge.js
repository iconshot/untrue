export class Edge {
  constructor(
    node,
    parent = null,
    domNode = null,
    children = [],
    component = null
  ) {
    this.node = node;
    this.parent = parent;
    this.domNode = domNode;
    this.children = children;
    this.component = component;
  }

  getNode() {
    return this.node;
  }

  getParent() {
    return this.parent;
  }

  getDomNode() {
    return this.domNode;
  }

  getChildren() {
    return this.children;
  }

  getComponent() {
    return this.component;
  }

  setNode(node) {
    this.node = node;
  }

  setParent(parent) {
    this.parent = parent;
  }

  setDomNode(domNode) {
    this.domNode = domNode;
  }

  setChildren(children) {
    this.children = children;
  }

  setComponent(component) {
    this.component = component;
  }

  clone() {
    return new Edge(
      this.node,
      this.parent,
      this.domNode,
      this.children,
      this.component
    );
  }
}
