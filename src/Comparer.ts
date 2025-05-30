import { Animation } from "./Animation/Animation";

import { Stateful } from "./Stateful/Stateful";

import { Persistor } from "./Persistor";
import { Ref } from "./Ref";
import { Var } from "./Var";
import { Slot } from "./Slot";
import { Emitter } from "./Emitter";

export class Comparer {
  /*

  deep comparison

  --

  (A) {
    hello: "world"
  }

  (B) {
    hello: "world"
  }

  "world" is equal to "world" so true will be returned
  
  --

  (A) {
    hello: (C) {
      hello: "world"
    }
  }

  (B) {
    hello: (D) {
      hello: "world"
    }
  }

  even though the references C and D are different,
  "world" is equal to "world" so true will be returned

  */

  public static compare(a: any, b: any): boolean {
    // for null a, check if b is also null

    if (a === null) {
      return b === null;
    }

    // for internal objects, check equality

    if (a instanceof Emitter || a instanceof Ref) {
      return a === b;
    }

    // for slots, check properties

    if (a instanceof Slot) {
      if (!(b instanceof Slot)) {
        return false;
      }

      const aContentType = a.getContentType();
      const bContentType = b.getContentType();

      if (aContentType !== bContentType) {
        return false;
      }

      const aAttributes = a.getAttributes();
      const bAttributes = b.getAttributes();

      if (!Comparer.compare(aAttributes, bAttributes)) {
        return false;
      }

      if (a.isClass() || a.isFunction()) {
        const aPropsChildren = a.getPropsChildren();
        const bPropsChildren = b.getPropsChildren();

        if (!Comparer.compare(aPropsChildren, bPropsChildren)) {
          return false;
        }
      } else {
        const aChildren = a.getChildren();
        const bChildren = b.getChildren();

        if (!Comparer.compare(aChildren, bChildren)) {
          return false;
        }
      }

      return true;
    }

    // for arrays, compare items deeply

    if (Array.isArray(a)) {
      if (!Array.isArray(b)) {
        return false;
      }

      if (a.length !== b.length) {
        return false;
      }

      return a.every((element, i): boolean => this.compare(element, b[i]));
    }

    // for objects, compare properties deeply

    if (typeof a === "object") {
      if (b === null) {
        return false;
      }

      if (Array.isArray(b)) {
        return false;
      }

      if (typeof b !== "object") {
        return false;
      }

      const aKeys = Object.getOwnPropertyNames(a);
      const bKeys = Object.getOwnPropertyNames(b);

      if (aKeys.length !== bKeys.length) {
        return false;
      }

      return aKeys.every(
        (key): boolean => key in b && this.compare(a[key], b[key])
      );
    }

    // for anything else, check equality

    return a === b;
  }
}
