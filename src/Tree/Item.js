export class Item {
  constructor(component, target, depthIndex) {
    this.component = component;
    this.target = target;
    this.depthIndex = depthIndex;
  }

  getComponent() {
    return this.component;
  }

  getTarget() {
    return this.target;
  }

  getDepthIndex() {
    return this.depthIndex;
  }
}
