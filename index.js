import Node from "./src/Node.js";
import Component from "./src/Component.js";
import Ref from "./src/Ref.js";
import Wrapper from "./src/Wrapper.js";
import Context from "./src/Context.js";
import Persistor from "./src/Persistor.js";
import Comparer from "./src/Comparer.js";

function $(...args) {
  return new Node(...args);
}

export default $;

export { Node, Component, Ref, Wrapper, Context, Persistor, Comparer };
