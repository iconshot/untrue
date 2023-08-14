class Ref {
  constructor(value = null) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }
}

module.exports = Ref;
