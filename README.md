# [Untrue](https://untrue.dev/)
JavaScript library for rendering user interfaces on web.

## Installation

```
npm i untrue
```

Compatible with any build tool: [Parcel](https://parceljs.org/), [Vite](https://vitejs.dev/), [Webpack](https://webpack.js.org/), etc.

## Get started

You can add Untrue to any part of your page.

```js
import { Node, Tree } from "untrue";

import App from "./App";

const root = document.getElementById("root");

const tree = new Tree(root);

tree.mount(new Node(App));
```

More on `App` in the next section.

## Basics

### Reactive

Untrue knows which nodes should be updated in the DOM.

```js
import { Component, Node } from "untrue";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };
  }

  onIncrement = () => {
    const { counter } = this.state;

    this.updateState({ counter: counter + 1 });
  };

  render() {
    const { counter } = this.state;

    return [
      new Node("span", counter),
      new Node("button", { onclick: this.onIncrement }, "increment"),
    ];
  }
}

export default App;
```

The output HTML will be:

```html
<span>0</span>
<button>increment</button>
```

`span` will be updated with the new `counter` every time `button` is clicked. 

### Encapsulated

Components can be classes or functions, and are used to group multiple nodes.

```jsx
import { Component, Node } from "untrue";

function Header() {
  return [
    new Node("h1", "untrue"),
    new Node("span", "made to win")
  ];
}

class Content extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };

    setInterval(() => {
      const { counter } = this.state;

      this.updateState({ counter: counter + 1 });
    }, 1000);
  }

  render() {
    const { counter } = this.state;

    return new Node("p", counter);
  }
}

function App() {
  return [
    new Node(Header),
    new Node(Content)
  ];
}

export default App;
```

The output HTML will be:

```html
<h1>untrue</h1>
<span>made to win</span>
<p>0</p>
```

`p` will be updated with the new `counter` every second because of the `setInterval`.

