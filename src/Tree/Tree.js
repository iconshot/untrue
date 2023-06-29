import { Node } from "../Node";
import { Ref } from "../Ref";

import { Item } from "./Item";
import { Edge } from "./Edge";
import { Target } from "./Target";

export class Tree {
  constructor(domNode) {
    // starting target's domNode

    this.domNode = domNode;

    // root edge

    this.edge = null;

    // rerender properties

    this.stack = [];

    this.timeout = null;
  }

  mount(node) {
    // unmount if there is a root edge

    if (this.edge !== null) {
      this.unmount();
    }

    // create starting target

    const target = new Target(this.domNode);

    /*
    
    we use Edge objects to store additional data,
    like domNode and component

    */

    this.edge = new Edge(node);

    // start the initial render

    this.renderEdge(this.edge, null, target, 0);
  }

  unmount() {
    // ignore if there is not a root edge

    if (this.edge === null) {
      return;
    }

    // create starting target

    const target = new Target(this.domNode);

    // start the unmounting

    this.unmountEdge(this.edge, target);

    // clear properties

    this.edge = null;

    this.stack = [];

    clearTimeout(this.timeout);

    this.timeout = null;
  }

  queue(component, target, depthIndex) {
    // if component is already in stack, ignore, it will be rerendered eventually

    const index = this.stack.findIndex(
      (item) => item.getComponent() === component
    );

    if (index !== -1) {
      return;
    }

    // create new item

    const item = new Item(component, target, depthIndex);

    this.stack.push(item);

    /*

    clear and set timeout

    this allows to batch multiple components being updated at the same time
    and also multiple update/updateState calls for a single component

    */

    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.rerender();
    });
  }

  unqueue(component) {
    // remove component's item from the stack

    this.stack = this.stack.filter((item) => item.getComponent() !== component);
  }

  rerender() {
    // end the recursion until queue() is called again

    if (this.stack.length === 0) {
      return;
    }

    // get a stack item, closer to the root first

    const item = this.stack.sort(
      (a, b) => a.getDepthIndex() - b.getDepthIndex()
    )[0];

    const component = item.getComponent();
    const target = item.getTarget();
    const depthIndex = item.getDepthIndex();

    /*
    
    clone edge to use with renderComponent
    
    the clone will have the references to current components and DOM nodes
    and the overall current sub-tree
    while edge will be updated inside renderComponent
    
    */

    const edge = component.getNode().getEdge();

    const clone = edge.clone();

    /*
    
    targetIndex means where should we start inserting DOM nodes inside targetDomNode
    
    we need to search for it in every rerender
    because a sibling component could remove/add DOM nodes from targetDomNode any time

    */

    const targetDomNode = target.getDomNode();

    const targetIndex = this.findTargetIndex(edge, targetDomNode);

    const newTarget = new Target(targetDomNode, targetIndex);

    // rerender component

    this.renderComponent(edge, clone, newTarget, depthIndex);

    // call again to rerender remaining components

    this.rerender();
  }

  // convert node.children to Edge objects

  parseChildren(edge) {
    const node = edge.getNode();

    const children = node instanceof Node ? node.getChildren() : [];

    const edges = children.map((child) => new Edge(child, edge));

    edge.setChildren(edges);
  }

  renderChildren(edge, currentEdge, target, depthIndex) {
    // parse the children first

    this.parseChildren(edge);

    // children will be an array of Edge objects

    const children = edge.getChildren();

    const currentChildren =
      currentEdge !== null ? currentEdge.getChildren() : [];

    // loop through currentChildren

    let i = -1;

    for (const currentChild of currentChildren) {
      i++;

      let child = null;

      // set child as equal child (based on type and key)

      if (
        currentChild.getNode() instanceof Node &&
        currentChild.getNode().getKey() !== null
      ) {
        const tmpChild = children.find((tmpChild) =>
          this.isEqual(currentChild, tmpChild)
        );

        child = tmpChild !== undefined ? tmpChild : null;
      }

      // if child is null, set child as same index child (only if they're equal)

      if (child === null && i < children.length) {
        const tmpChild = children[i];

        if (this.isEqual(currentChild, tmpChild)) {
          child = tmpChild;
        }
      }

      // if not an equal child has been found, unmount currentChild

      if (child === null) {
        this.unmountEdge(currentChild, target);
      }
    }

    // loop through children

    let j = -1;

    for (const child of children) {
      j++;

      let currentChild = null;

      // set currentChild as equal current child (based on type and key)

      if (
        child.getNode() instanceof Node &&
        child.getNode().getKey() !== null
      ) {
        const tmpChild = currentChildren.find((tmpChild) =>
          this.isEqual(child, tmpChild)
        );

        currentChild = tmpChild !== undefined ? tmpChild : null;
      }

      // if currentChild is null, set currentChild as same index current child (only if they're equal)

      if (currentChild === null && j < currentChildren.length) {
        const tmpChild = currentChildren[j];

        if (this.isEqual(child, tmpChild)) {
          currentChild = tmpChild;
        }
      }

      /*
      
      render child

      currentChild will have the references to the current sub-tree

      "depthIndex + 1" is needed so we can have the right depthIndex for every descendant

      */

      this.renderEdge(child, currentChild, target, depthIndex + 1);
    }
  }

  renderEdge(edge, currentEdge, target, depthIndex) {
    const node = edge.getNode();

    /*

    check type of node and call the right render method

    null, undefined and false values are ignored

    */

    if (node instanceof Node) {
      if (node.isComponent()) {
        this.renderComponent(edge, currentEdge, target, depthIndex);
      } else if (node.isFunction()) {
        this.renderFunction(edge, currentEdge, target, depthIndex);
      } else if (node.isElement()) {
        this.renderElement(edge, currentEdge, target, depthIndex);
      } else if (node.isNull()) {
        this.renderNull(edge, currentEdge, target, depthIndex);
      }
    } else if (node !== null && node !== undefined && node !== false) {
      this.renderString(edge, currentEdge, target);
    }
  }

  renderComponent(edge, currentEdge, target, depthIndex) {
    // get node and currentNode

    const node = edge.getNode();

    const currentNode = currentEdge !== null ? currentEdge.getNode() : null;

    // get type and props

    const type = node.getType();
    const props = node.getProps();

    // get current component (if any)

    let component = currentEdge !== null ? currentEdge.getComponent() : null;

    // create the new component or update the current one

    if (currentEdge === null) {
      const ComponentClass = type;

      component = new ComponentClass(props);
    } else {
      component.updateProps(props);
    }

    // update node with new edge

    node.setEdge(edge);

    // update component with new node

    component.setNode(node);

    // update edge with the new component or the current one

    edge.setComponent(component);

    // unqueue component

    this.unqueue(component);

    // update ref and currentRef if necessary

    const ref = node.getRef();

    const currentRef = currentNode !== null ? currentNode.getRef() : null;

    if (
      currentRef !== null &&
      currentRef instanceof Ref &&
      currentRef !== ref
    ) {
      currentRef.setValue(null);
    }

    if (ref !== null && ref instanceof Ref && ref !== currentRef) {
      ref.setValue(component);
    }

    /*
    
    replaceUpdated() will move component.nextState and component.nextProps
    to component.state and component.props respectively

    after this point, we will have the right component.state and component.props

    */

    if (component.isUpdated()) {
      component.replaceUpdated();
    }

    // now it's safe to get component's new content

    const children = component.render();

    /*

    store the content inside node

    the renderChildren() method will then call parseChildren(),
    which will convert all the child nodes to Edge objects

    for updated components, currentEdge will be a clone of edge,
    meaning node will be equal to currentEdge.getNode(),
    but this shouldn't be a problem because first we call node.setChildren
    which will update node with the new child nodes
    and then we call renderChildren which will call parseChildren
    meaning every child edge will be brand new,
    all of this while currentEdge keeps the current sub-tree

    */

    node.setChildren(children);

    this.renderChildren(edge, currentEdge, target, depthIndex);

    /*
    
    because of this is the final line, deeper components will trigger render first

    the handler passed to triggerRender will be used
    when there's a "rerender" event fired in the component

    */

    component.triggerRender(() => {
      this.queue(component, target, depthIndex);
    });
  }

  renderFunction(edge, currentEdge, target, depthIndex) {
    const node = edge.getNode();

    const type = node.getType();
    const props = node.getProps();

    const Function = type;

    const children = Function(props);

    /*

    same as with the renderComponent, we call node.setChildren() and then renderChildren()
    while keeping the current sub-tree inside currentEdge

    */

    node.setChildren(children);

    this.renderChildren(edge, currentEdge, target, depthIndex);
  }

  renderElement(edge, currentEdge, target, depthIndex) {
    // domNode will be an element node

    const domNode =
      currentEdge === null
        ? this.createDomNode(edge)
        : currentEdge.getDomNode();

    edge.setDomNode(domNode);

    this.patchDomNode(edge, currentEdge);

    target.insert(domNode);

    /*
    
    newTarget is needed to insert child DOM nodes inside domNode

    no need to find a targetIndex
    we want target to start from 0
    every time target.insert() is called
    it increments the target.index internally

    */

    const newTarget = new Target(domNode);

    this.renderChildren(edge, currentEdge, newTarget, depthIndex);
  }

  renderNull(edge, currentEdge, target, depthIndex) {
    // if node type is null, we do nothing but loop through its children

    this.renderChildren(edge, currentEdge, target, depthIndex);
  }

  renderString(edge, currentEdge, target) {
    // domNode will be a text node

    const domNode =
      currentEdge === null
        ? this.createDomNode(edge)
        : currentEdge.getDomNode();

    edge.setDomNode(domNode);

    this.patchDomNode(edge, currentEdge);

    target.insert(domNode);

    // text nodes are leafs, so no need for renderChildren()
  }

  createDomNode(edge) {
    // according to the node type, create an element node or a text node

    const node = edge.getNode();

    if (node instanceof Node) {
      const type = node.getType();

      return document.createElement(type);
    } else {
      const text = `${node}`;

      return document.createTextNode(text);
    }
  }

  patchDomNode(edge, currentEdge) {
    const node = edge.getNode();

    const domNode = edge.getDomNode();

    const currentNode = currentEdge !== null ? currentEdge.getNode() : null;

    if (node instanceof Node) {
      // domNode is an element node

      const attributes = node.getAttributes();

      const currentAttributes =
        currentNode !== null ? currentNode.getAttributes() : {};

      // loop through attributes

      for (const key in attributes) {
        const value = attributes[key];

        const currentValue =
          key in currentAttributes ? currentAttributes[key] : null;

        switch (key) {
          case "key": {
            break;
          }

          case "ref": {
            const ref = value;
            const currentRef = currentValue;

            // update ref and currentRef

            if (
              currentRef !== null &&
              currentRef instanceof Ref &&
              currentRef !== ref
            ) {
              currentRef.setValue(null);
            }

            if (ref !== null && ref instanceof Ref && ref !== currentRef) {
              ref.setValue(domNode);
            }

            break;
          }

          default: {
            const isValueHandler = typeof value === "function";
            const isCurrentValueHandler = typeof currentValue === "function";

            if (value !== null) {
              // we have an attribute

              if (isValueHandler) {
                // set the element's handler

                if (currentValue !== null && !isCurrentValueHandler) {
                  domNode.removeAttribute(key);
                }

                if (value !== currentValue) {
                  const handler = value;

                  domNode[key] = (...args) => {
                    return handler(...args, domNode);
                  };
                }
              } else {
                // set the element's attribute

                if (currentValue !== null && isCurrentValueHandler) {
                  domNode[key] = null;
                }

                if (value !== currentValue) {
                  domNode.setAttribute(key, value);
                }
              }
            } else {
              // value is null

              if (currentValue !== null) {
                // delete element's handler or attribute

                if (isCurrentValueHandler) {
                  domNode[key] = null;
                } else {
                  domNode.removeAttribute(key);
                }
              }
            }

            break;
          }
        }
      }

      // loop through currentAttributes

      for (const key in currentAttributes) {
        // ignore if key not found in attributes

        const found = key in attributes;

        if (found) {
          continue;
        }

        const currentValue = currentAttributes[key];

        switch (key) {
          case "ref": {
            // update currentRef

            const currentRef = currentValue;

            if (currentRef !== null && currentRef instanceof Ref) {
              currentRef.setValue(null);
            }
          }

          default: {
            // delete element's handler or attribute

            const isCurrentValueHandler = typeof currentValue === "function";

            if (isCurrentValueHandler) {
              domNode[key] = null;
            } else {
              domNode.removeAttribute(key);
            }
          }
        }
      }
    } else {
      // domNode is a text node

      const text = `${node}`;

      const currentText = currentNode !== null ? `${currentNode}` : null;

      if (text !== currentText) {
        domNode.nodeValue = text;
      }
    }
  }

  /*

  this method will search for the targetDomNode inside the edge's previous siblings
  then it will return the right target index used to create a new Target

  if the targetDomNode is not found in the siblings,
  it will search in the parent siblings, creating a recursion
  
  this means it will start with edge but the cursor will be moved up the tree
  until a value is returned

  it returns 0 in specific cases

  --

  # tree 1:

  Tree.domNode x

  edge A {
    parent null
    domNode null
    children {
      edge AA {
        parent A
        domNode null
        children {
          edge AAA {
            parent AA
            domNode y
            children {}
          }
        }
      }
      edge AB {
        parent A
        domNode null
        children {
          edge ABA {
            parent AB
            domNode z
            children {}
          }
        }
      }
      edge AC {
        parent A
        domNode null
        children {
          edge ACA {
            parent AC
            domNode t
            children {}
          }
        }
      }
    }
  }

  findTargetIndex(A, x) => 0 (from parent === null, without recursion)
  findTargetIndex(AA, x) => 0 (from parent === null, with recursion)
  findTargeTIndex(AB, x) => 1 (from findDomNodeIndex, found in 0)
  findTargeTIndex(AC, x) => 2 (from findDomNodeIndex, found in 1)

  --

  # tree 2:

  Tree.domNode x

  edge A {
    parent null
    domNode null
    children {
      edge AA {
        parent A
        domNode y
        children {
          edge AAA {
            parent AA
            domNode null
            children {
              edge AAAA {
                parent AAA
                domNode z
                children {}
              }
            }
          }
          edge AAB {
            parent AA
            domNode null
            children {
              edge AAABA {
                parent AAB
                domNode t
                children {}
              }
            }
          }
          edge AAC {
            parent AA
            domNode null
            children {
              edge AAACA {
                parent AAC
                domNode u
                children {}
              }
            }
          }
        }
      }
    }
  }

  findTargetIndex(AAA, y) => 0 (from domNode === targetDomNode)
  findTargetIndex(AAB, y) => 1 (from findDomNodeIndex, found in 0)
  findTargetIndex(AAC, y) => 2 (from findDomNodeIndex, found in 1)

  */

  findTargetIndex(edge, targetDomNode) {
    /*
    
    we work with the parent because we need to loop through the edge's previous siblings

    parent's children = edge siblings

    */

    const parent = edge.getParent();

    // no parent means edge is the initial this.edge, fall back to 0

    if (parent === null) {
      return 0;
    }

    const domNode = parent.getDomNode();
    const children = parent.getChildren();

    const index = children.indexOf(edge);

    // loop children from index - 1 to 0

    for (let i = index - 1; i >= 0; i--) {
      const child = children[i];

      const j = this.findDomNodeIndex(child, targetDomNode);

      if (j !== null) {
        // j + 1 is needed so we return the index where the Target object needs to start from

        return j + 1;
      }
    }

    /*
    
    targetDomNode hasn't been found among the edge's previous siblings,
    it's time to start looking in the parent's previous siblings
    
    but first we check for a specific case:
    if domNode (the parent's domNode) is the same as targetDomNode,
    it means parent is the targetDomNode's edge itself,
    so we can end the recursion and fall back to 0

    */

    if (domNode === targetDomNode) {
      return 0;
    }

    // it calls itself again (recursion), but this time with parent instead of edge

    return this.findTargetIndex(parent, targetDomNode);
  }

  /*

  this method will find the last domNode in the edge sub-tree
  and return its index in targetDomNode.childNodes

  if no domNode is found in the sub-tree, it returns null

  it uses recursion under the hood
  
  we create a loop between the edge's children from last to first
  and we execute findDomNodeIndex() to every child

  if edge's domNode is not null, it means we have found the edge we need,
  we return the index of the edge's domNode as a child of targetDomNode,
  this will end the entire loop
  
  otherwise we keep the loop going deeper and deeper, from last to first every time,
  until we find an edge that has a domNode
  
  again, if we don't find any domNode down the sub-tree, null is returned

  if the very first edge passed has a domNode, we won't even enter the loop
  it will return the index right away

  --

  # tree:

  Tree.domNode x

  edge A {
    domNode null
    children {
      edge AA {
        domNode null
        children {
          edge AAA {
            domNode y
            children {}
          }
        }
      }
      edge AB {
        domNode null
        children {
          edge ABA {
            domNode z
            children {}
          }
          edge ABB {
            domNode null
            children {
              edge ABBA {
                domNode t
                children {}
              }
            }
          }
        }
      }
      edge AC {
        domNode null
        children {
          edge ACA {
            domNode null
            children {}
          }
        }
      }
    }
  }

  findDomNodeIndex(AA, x) -> 0 (found in AAA)
  findDomNodeIndex(AB, x) -> 2 (found in ABBA)
  findDomNodeIndex(AC, x) -> null

  */

  findDomNodeIndex(edge, targetDomNode) {
    const domNode = edge.getDomNode();

    /*
    
    if domNode found, get the index
    that will implicitly end the recursion with an actual value

    */

    if (domNode !== null) {
      return [...targetDomNode.childNodes].indexOf(domNode);
    }

    const children = edge.getChildren();

    // loop children from last to first

    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];

      // apply recursion

      const index = this.findDomNodeIndex(child, targetDomNode);

      // as soon as we find an index, the recursion is ended

      if (index !== null) {
        return index;
      }
    }

    // no domNode has been found down the sub-tree

    return null;
  }

  unmountEdge(edge, target) {
    const node = edge.getNode();
    const domNode = edge.getDomNode();
    const component = edge.getComponent();
    const children = edge.getChildren();

    // remove dom node, if any

    if (domNode !== null) {
      target.remove(domNode);
    }

    // update ref

    const ref = node instanceof Node ? node.getRef() : null;

    if (ref !== null && ref instanceof Ref) {
      ref.setValue(null);
    }

    // unmount children

    for (const child of children) {
      const finalTarget = domNode !== null ? new Target(domNode) : target;

      this.unmountEdge(child, finalTarget);
    }

    /*
    
    unmount component, if any

    this is called at the very end of the method
    to keep consistency with renderComponent

    deeper components will fire the 'unmount' event first

    */

    if (component !== null) {
      this.unqueue(component);

      component.triggerUnmount();
    }
  }

  isEqual(edge, currentEdge) {
    const node = edge.getNode();
    const currentNode = currentEdge.getNode();

    if (node instanceof Node) {
      //  check nodes based on type and key

      if (!(currentNode instanceof Node)) {
        return false;
      }

      const type = node.getType();
      const key = node.getKey();

      const currentType = currentNode.getType();
      const currentKey = currentNode.getKey();

      return type === currentType && key === currentKey;
    } else if (node === null || node === undefined || node === false) {
      // null, undefined and false are special cases since they will be ignored by renderEdge

      return (
        currentNode === null ||
        currentNode === undefined ||
        currentNode === false
      );
    } else {
      // check if both nodes are texts

      return (
        currentNode !== null &&
        currentNode !== undefined &&
        currentNode !== false &&
        !(currentNode instanceof Node)
      );
    }
  }
}
