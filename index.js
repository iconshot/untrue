const Node = require("./src/Node");
const Component = require("./src/Component");
const Ref = require("./src/Ref");
const Wrapper = require("./src/Wrapper");
const Context = require("./src/Context");
const Persistor = require("./src/Persistor");
const Comparer = require("./src/Comparer");

function $(...args) {
  return new Node(...args);
}

module.exports = {
  $,
  Node,
  Component,
  Ref,
  Wrapper,
  Context,
  Persistor,
  Comparer,
};
