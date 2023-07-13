import { EventEmitter } from "eventemitter3";

import { Node } from "./Node";
import { Ref } from "./Ref";

export class Emitter extends EventEmitter {
  /*

  compareShallow will receive two objects
  and will perform a comparison for every property of those two objects

  the comparison will be shallow

  --

  A {
    hello: "world"
  }

  B {
    hello: "mars"
  }

  the comparison will be performed for the "hello" properties, not A and B themselves

  "world" is not equal to "mars" so false will be returned

  */

  compareShallow(value, currentValue) {
    const compare = (value, currentValue) => {
      // for null values, check if currentValue is also null

      if (value === null) {
        return currentValue === null;
      }

      // for arrays, compare items shallowly

      if (Array.isArray(value)) {
        if (!Array.isArray(currentValue)) {
          return false;
        }

        if (value.length !== currentValue.length) {
          return false;
        }

        return value.every((item, i) => item === currentValue[i]);
      }

      // for Node and Ref objects, check equality

      if (value instanceof Node) {
        return value === currentValue;
      }

      if (value instanceof Ref) {
        return value === currentValue;
      }

      // for objects, compare properties shallowly

      if (typeof value === "object") {
        if (currentValue === null) {
          return false;
        }

        if (Array.isArray(currentValue)) {
          return false;
        }

        /*

        reached here, value is not Node nor Ref
        so if currentValue is Node or Ref,
        we return false

        */

        if (currentValue instanceof Node) {
          return false;
        }

        if (currentValue instanceof Ref) {
          return false;
        }

        if (typeof currentValue !== "object") {
          return false;
        }

        const keys = Object.keys(value);
        const currentKeys = Object.keys(currentValue);

        if (keys.length !== currentKeys.length) {
          return false;
        }

        return keys.every(
          (key) => key in currentValue && value[key] === currentValue[key]
        );
      }

      // for anything else, check equality

      return value === currentValue;
    };

    const keys = Object.keys(value);
    const currentKeys = Object.keys(currentValue);

    if (keys.length !== currentKeys.length) {
      return false;
    }

    return keys.every(
      (key) => key in currentValue && compare(value[key], currentValue[key])
    );
  }

  /*

  compareDeep will receive two objects
  and will perform a comparison for every property of those two objects

  the comparison will be deep

  --

  like compareShallow, compareDeep will do the comparison for the properties of A and B, not A and B themselves

  A {
    hello: "world"
  }

  B {
    hello: "mars"
  }

  "world" is not equal to "mars" so false will be returned

  */

  compareDeep(value, currentValue) {
    const compare = (value, currentValue) => {
      // for null values, check if currentValue is also null

      if (value === null) {
        return currentValue === null;
      }

      // for arrays, compare items deeply

      if (Array.isArray(value)) {
        if (!Array.isArray(currentValue)) {
          return false;
        }

        if (value.length !== currentValue.length) {
          return false;
        }

        return value.every((item, i) => compare(item, currentValue[i]));
      }

      // for Node and Ref objects, check equality

      if (value instanceof Node) {
        return value === currentValue;
      }

      if (value instanceof Ref) {
        return value === currentValue;
      }

      // for objects, compare properties deeply

      if (typeof value === "object") {
        if (currentValue === null) {
          return false;
        }

        if (Array.isArray(currentValue)) {
          return false;
        }

        /*

        reached here, value is not Node nor Ref
        so if currentValue is Node or Ref,
        we return false

        */

        if (currentValue instanceof Node) {
          return false;
        }

        if (currentValue instanceof Ref) {
          return false;
        }

        if (typeof currentValue !== "object") {
          return false;
        }

        const keys = Object.keys(value);
        const currentKeys = Object.keys(currentValue);

        if (keys.length !== currentKeys.length) {
          return false;
        }

        return keys.every(
          (key) => key in currentValue && compare(value[key], currentValue[key])
        );
      }

      // for anything else, check equality

      return value === currentValue;
    };

    const keys = Object.keys(value);
    const currentKeys = Object.keys(currentValue);

    if (keys.length !== currentKeys.length) {
      return false;
    }

    return keys.every(
      (key) => key in currentValue && compare(value[key], currentValue[key])
    );
  }
}
