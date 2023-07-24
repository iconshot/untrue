# [Untrue](https://untrue.dev/)

JavaScript library for rendering user interfaces.

## Installation

The easiest way to get started with Untrue is through a web app.

```
npm i untrue @untrue/web
```

Compatible with any build tool: [Parcel](https://parceljs.org/), [Vite](https://vitejs.dev/), [Webpack](https://webpack.js.org/), etc.

Native app development coming soon.

## Get started

You can add Untrue to any part of your page.

```js
import { Node } from "untrue";

import { Tree } from "@untrue/web";

import App from "./App";

const root = document.getElementById("root");

const tree = new Tree(root);

tree.mount(new Node(App));
```

In this case, we're adding Untrue to `#root`.

More on `App` in the next section.

## Basic features

### Interactivity

A component state can change at any time and Untrue knows which nodes should be updated in the DOM.

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
    // after the first click, counter is no longer 0 but 1

    const { counter } = this.state;

    // regular arrays are used to return multiple nodes

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
<span>0</span> <button>increment</button>
```

`button` will have an `onclick` listener attached to it.

`span` will be updated with the new `counter` every time `button` is clicked.

### Modularity

Components can be classes or functions and are used to group multiple nodes.

```jsx
import { Component, Node } from "untrue";

function App() {
  return [
    new Node(Header, { title: "Untrue" }), // pass title as prop (external data)
    new Node(Footer, { year: 2049 }), // pass year as prop (external data)
  ];
}

class Header extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };
  }

  onIncrement = () => {
    const { counter } = this.state;

    this.updateState({ counter: counter + 1 });
  };

  render() {
    const { title } = this.props; // external data

    const { counter } = this.state; // internal data

    return new Node("header", [
      new Node("h1", title),
      new Node("span", counter),
      new Node("button", { onclick: this.onIncrement }, "increment"),
    ]);
  }
}

function Footer({ year }) {
  return new Node("footer", [
    new Node("span", `copyright, ${year}`),
    new Node("a", { href: "https://example.com" }, "follow me"),
  ]);
}

export default App;
```

The output HTML will be:

```html
<header>
  <h1>Untrue</h1>
  <span>0</span>
  <button>increment</button>
</header>
<footer>
  <span>copyright, 2049</span>
  <a href="https://example.com">follow me</a>
</footer>
```

`Header` will be stateful while `Footer` will be stateless. Both components receive `props`.

### Lifecycle events

- `render`: Every render, whether it's a mount or an update.
- `mount`: The first render.
- `update`: Every rerender, whether it's caused by the component itself or a parent component.
- `unmount`: Component is no longer part of the Tree.

Multiple event listeners can be attached to a single event. Specially useful to have more organized code.

```jsx
import { Component, Node } from "untrue";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };

    this.interval = null;

    // start interval on mount

    this.on("mount", () => {
      this.interval = setInterval(() => {
        const { counter } = this.state;

        this.updateState({ counter: counter + 1 });
      }, 5000);
    });

    // clear interval on unmount

    this.on("unmount", () => {
      clearInterval(this.interval);
    });

    // check "counter" change on update

    this.on("update", () => {
      // this.props and this.prevProps are also available

      const { counter } = this.state;
      const { counter: prevCounter } = this.prevState;

      if (counter !== prevCounter) {
        alert("Counter has been updated.");
      }
    });
  }

  render() {
    const { counter } = this.state;

    return new Node("span", counter);
  }
}

export default App;
```

The output HTML will be:

```html
<span>0</span>
```

An `alert` will happen every 5 seconds because `interval` updates `counter` on every call.