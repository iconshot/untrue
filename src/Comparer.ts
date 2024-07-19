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

  static compare(a: any, b: any): boolean {
    // for null a, check if b is also null

    if (a === null) {
      return b === null;
    }

    // for arrays, compare items deeply

    if (Array.isArray(a)) {
      if (!Array.isArray(b)) {
        return false;
      }

      if (a.length !== b.length) {
        return false;
      }

      return a.every((element, i) => this.compare(element, b[i]));
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

      return aKeys.every((key) => key in b && this.compare(a[key], b[key]));
    }

    // for anything else, check equality

    return a === b;
  }
}
