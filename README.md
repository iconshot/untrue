# [Untrue](https://untrue.dev/)

JavaScript library for rendering web user interfaces.

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

In this case, we're adding Untrue to `root`.

More on `App` in the next section.

## Basic features

### Reactivity

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

`span` will be updated with the new `counter` every time `button` is clicked.

### Modularity

Components can be classes or functions and are used to group multiple nodes.

```jsx
import { Component, Node } from "untrue";

function Header() {
  // regular arrays are used to return multiple nodes

  return [new Node("h1", "untrue"), new Node("span", "made to win")];
}

class Content extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };

    // increment counter every second

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
  return [new Node(Header), new Node(Content)];
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

### Lifecycle events

- `render`: Every render, whether it's a mount or an update.
- `mount`: The first render.
- `update`: Every rerender, whether it's caused by the component itself or a parent component.
- `unmount`: Component is no longer part of the Tree.

Multiple event listeners can be attached to a single event. Specially useful to separate related code.

```jsx
import { Component, Node } from "untrue";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { counter: 0 };

    // run every second

    setInterval(() => {
      const { counter } = this.state;

      this.updateState({ counter: counter + 1 });
    }, 1000);
  }

  render() {
    const { counter } = this.state;

    // pass counter as a prop

    return new Node(Child, { counter });
  }
}

class Child extends Component {
  constructor(props) {
    super(props);

    this.on("mount", () => {
      // mounted
    });

    this.on("update", () => {
      // updated

      const { counter } = this.props;
      const { counter: prevCounter } = this.prevProps;

      if (counter !== prevCounter) {
        // counter has been updated
      }
    });

    this.on("unmount", () => {
      // unmounted
    });
  }

  render() {
    const { counter } = this.props;

    return new Node("span", counter);
  }
}

export default App;
```

The output HTML will be:

```html
<span>0</h1>
```

`span` will be updated with the new `counter` every second because of the `setInterval`.
