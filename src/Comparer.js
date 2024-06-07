class Comparer {
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

  static compare(value, currentValue) {
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

      return value.every((item, i) => this.compare(item, currentValue[i]));
    }

    // for objects, compare properties deeply

    if (typeof value === "object") {
      if (currentValue === null) {
        return false;
      }

      if (Array.isArray(currentValue)) {
        return false;
      }

      if (typeof currentValue !== "object") {
        return false;
      }

      const keys = Object.getOwnPropertyNames(value);
      const currentKeys = Object.getOwnPropertyNames(currentValue);

      if (keys.length !== currentKeys.length) {
        return false;
      }

      return keys.every(
        (key) =>
          key in currentValue && this.compare(value[key], currentValue[key])
      );
    }

    // for anything else, check equality

    return value === currentValue;
  }
}

export default Comparer;
