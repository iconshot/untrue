export class Target {
  constructor(domNode, index = 0) {
    // nodes will be added to this domNode

    this.domNode = domNode;

    // the inserting will start from this index

    this.index = index;
  }

  getDomNode() {
    return this.domNode;
  }

  getIndex() {
    return this.index;
  }

  insert(child) {
    // get the currentChild based on this.index, it can be null

    const currentChild =
      this.index < this.domNode.childNodes.length
        ? this.domNode.childNodes[this.index]
        : null;

    // insert the child before currentChild or append it to this.domNode when necessary

    if (currentChild !== null) {
      if (child !== currentChild) {
        currentChild.before(child);
      }
    } else {
      this.domNode.append(child);
    }

    this.index++;
  }

  remove(child) {
    // if child is in this.domNode, remove it

    if (this.domNode.contains(child)) {
      child.remove();
    }
  }
}
