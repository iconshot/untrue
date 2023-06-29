import { EventEmitter } from "eventemitter3";

import { Node } from "./Node";
import { Ref } from "./Ref";

export class Emitter extends EventEmitter {
  compareShallow(value, currentValue) {
    const compare = (value, currentValue) => {
      // for null values, check if currentValue is also null

      if (value === null) {
        return currentValue === null;
      }

      // for arrays, compare items shallowly

      if (Array.isArray(value)) {
        return (
          Array.isArray(currentValue) &&
          value.length === currentValue.length &&
          value.every((item, i) => item === currentValue[i])
        );
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
        const keys = Object.keys(value);

        return (
          currentValue !== null &&
          typeof currentValue === "object" &&
          keys.every(
            (key) => key in currentValue && value[key] === currentValue[key]
          )
        );
      }

      // for anything else, check equality

      return value === currentValue;
    };

    // compare every property

    const keys = Object.keys(value);
    const currentKeys = Object.keys(currentValue);

    return (
      keys.length === currentKeys.length &&
      keys.every(
        (key) => key in currentValue && compare(value[key], currentValue[key])
      )
    );
  }

  compareDeep(value, currentValue) {
    const compare = (value, currentValue) => {
      // for null values, check if currentValue is also null

      if (value === null) {
        return currentValue === null;
      }

      // for arrays, compare items deeply

      if (Array.isArray(value)) {
        return (
          Array.isArray(currentValue) &&
          value.length === currentValue.length &&
          value.every((item, i) => compare(item, currentValue[i]))
        );
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
        const keys = Object.keys(value);

        return (
          currentValue !== null &&
          typeof currentValue === "object" &&
          keys.every(
            (key) =>
              key in currentValue && compare(value[key], currentValue[key])
          )
        );
      }

      // for anything else, check equality

      return value === currentValue;
    };

    // compare every property

    const keys = Object.keys(value);
    const currentKeys = Object.keys(currentValue);

    return (
      keys.length === currentKeys.length &&
      keys.every(
        (key) => key in currentValue && compare(value[key], currentValue[key])
      )
    );
  }
}
