const Component = require("./Component");

class Node {
  /*

  constructor(children)
  constructor(type)
  constructor(type, attributes)
  constructor(type, children)
  constructor(type, attributes, children)

  */

  constructor(...args) {
    let type = null;
    let attributes = {};
    let children = [];

    switch (args.length) {
      case 0: {
        break;
      }

      case 1: {
        if (args[0] instanceof Node || Array.isArray(args[0])) {
          children = args[0];
        } else {
          type = args[0];
        }

        break;
      }

      case 2: {
        type = args[0];

        if (args[1] instanceof Node || Array.isArray(args[1])) {
          children = args[1];
        } else {
          if (typeof args[1] === "object" && args[1] !== null) {
            attributes = args[1];
          } else {
            children = args[1];
          }
        }

        break;
      }

      default: {
        [type, attributes, children] = args;

        break;
      }
    }

    if (
      !(
        type === null ||
        type.prototype === Component ||
        type.prototype instanceof Component ||
        typeof type === "function" ||
        typeof type === "string"
      )
    ) {
      throw new Error(
        "Node type must be a Component, function, string or null."
      );
    }

    if (typeof attributes !== "object" || attributes === null) {
      throw new Error("Node attributes must be an object.");
    }

    if (!Array.isArray(children)) {
      children = [children];
    }

    children = this.parseChildren(children);

    /*
    
    if type is a component (class or function),
    the children will be stored as an attributes property
    
    this allows us to pass children to the component, like so:
    
      new Node(Component, props, children)
    
    then we can have the children passed from the props object

    classes:
    
      ...

      render() {
        const {children} = this.props
        
        return new Node("section", children)
      }

    functions:

      function Component({children}) {
        return new Node("section", children)
      }

    later on the render process, we'll get the actual children
    from what component.render() returns in case of class components
    or what the function returns in case of function components

    */

    if (
      type !== null &&
      (type.prototype === Component ||
        type.prototype instanceof Component ||
        typeof type === "function")
    ) {
      attributes.children = children;
      children = [];
    }

    this.type = type;
    this.attributes = attributes;
    this.children = children;
  }

  getType() {
    return this.type;
  }

  getAttributes() {
    return this.attributes;
  }

  getChildren() {
    return this.children;
  }

  setType(type) {
    if (
      !(
        type === null ||
        type.prototype === Component ||
        type.prototype instanceof Component ||
        typeof type === "function" ||
        typeof type === "string"
      )
    ) {
      throw new Error(
        "Node type must be a Component, function, string or null."
      );
    }

    this.type = type;
  }

  setAttributes(attributes) {
    if (typeof attributes !== "object" || attributes === null) {
      throw new Error("Node attributes must be an object.");
    }

    this.attributes = attributes;
  }

  setChildren(children) {
    if (!Array.isArray(children)) {
      children = [children];
    }

    children = this.parseChildren(children);

    this.children = children;
  }

  isComponent() {
    return (
      this.type !== null &&
      (this.type.prototype === Component ||
        this.type.prototype instanceof Component)
    );
  }

  isFunction() {
    return typeof this.type === "function";
  }

  isElement() {
    return typeof this.type === "string";
  }

  isNull() {
    return this.type === null;
  }

  getKey() {
    const { key = null } = this.attributes;

    return key;
  }

  getRef() {
    const { ref = null } = this.attributes;

    return ref;
  }

  getProps() {
    const { key, ref, ...props } = this.attributes;

    return props;
  }

  /*
  
  method necessary for cases when we have arrays inside children:

    new Node("div", [["a", "b"], "text"])

  the output will be:

    new Node("div", [new Node(["a", "b"]), "text"])

  this way Tree won't have a problem traversing the sub-tree

  */

  parseChildren(children) {
    return children.map((child) =>
      Array.isArray(child) ? new Node(child) : child
    );
  }
}

module.exports = Node;
