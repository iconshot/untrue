import { Node } from "./src/Node.js";

function $(...args) {
  return new Node(...args);
}

export default $;

export * from "./src/Node.js";
export * from "./src/Component.js";
export * from "./src/Ref.js";
export * from "./src/Wrapper.js";
export * from "./src/Context.js";
export * from "./src/Persistor.js";
export * from "./src/Comparer.js";
