class Comparer {
  /*

  compareShallow will receive two objects
  and will perform a comparison for every property of those two objects

  the comparison will be shallow

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

  the references C and D are different so false will be returned

  */

  static compareShallow(value, currentValue) {
    const keys = Object.getOwnPropertyNames(value);
    const currentKeys = Object.getOwnPropertyNames(currentValue);

    if (keys.length !== currentKeys.length) {
      return false;
    }

    return keys.every(
      (key) => key in currentValue && value[key] === currentValue[key]
    );
  }

  /*

  compareDeep will receive two objects
  and will perform a comparison for every property of those two objects

  the comparison will be deep

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

  static compareDeep(value, currentValue) {
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
          (key) => key in currentValue && compare(value[key], currentValue[key])
        );
      }

      // for anything else, check equality

      return value === currentValue;
    };

    const keys = Object.getOwnPropertyNames(value);
    const currentKeys = Object.getOwnPropertyNames(currentValue);

    if (keys.length !== currentKeys.length) {
      return false;
    }

    return keys.every(
      (key) => key in currentValue && compare(value[key], currentValue[key])
    );
  }
}

module.exports = Comparer;
