# [Untrue](https://untrue.dev/)

JavaScript library for rendering user interfaces.

## Installation

The easiest way to get started with Untrue is through a web app.

```
npm i untrue @untrue/web
```

Compatible with any build tool: [Parcel](https://parceljs.org/), [Vite](https://vitejs.dev/), [Webpack](https://webpack.js.org/), etc.

<sub>Native app development available with [Detonator](https://detonator.dev).</sub>

## Get started

You can add Untrue to any part of your page.

```ts
import $ from "untrue";

import { Tree } from "@untrue/web";

import App from "./App";

const tree = new Tree(document.body);

// $ is a shorthand to represent slots

tree.mount($(App));
```

In this case, we're adding Untrue to `body`.

More on `App` in the next section.

## Basic features

### Interactivity

A component state can change at any time and Untrue knows which nodes should be updated in the DOM.

```ts
import $, { Component, Props, State } from "untrue";

interface AppState extends State {
  counter: number;
}

class App extends Component<Props, AppState> {
  init(): void {
    this.state = { counter: 0 };
  }

  onIncrement = (): void => {
    const { counter } = this.state;

    this.updateState({ counter: counter + 1 });
  };

  render(): any {
    // after the first click, counter is no longer 0 but 1

    const { counter } = this.state;

    // regular arrays are used to return multiple slots

    return [
      $("span", counter),
      $("button", { onclick: this.onIncrement }, "increment"),
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

Components can be classes or functions and are used to group multiple slots.

```ts
import $, { Component, Props, State } from "untrue";

function App(): any {
  return [
    $(Header, { title: "Untrue" }), // pass title as prop (external data)
    $(Footer, { year: 2049 }), // pass year as prop (external data)
  ];
}

interface HeaderProps extends Props {
  title: string;
}

interface HeaderState extends State {
  counter: number;
}

class Header extends Component<HeaderProps, HeaderState> {
  init(): void {
    this.state = { counter: 0 };
  }

  onIncrement = (): void => {
    const { counter } = this.state;

    this.updateState({ counter: counter + 1 });
  };

  render(): any {
    const { title } = this.props; // external data

    const { counter } = this.state; // internal data

    return $("header", [
      $("h1", title),
      $("span", counter),
      $("button", { onclick: this.onIncrement }, "increment"),
    ]);
  }
}

interface FooterProps extends Props {
  year: number;
}

function Footer({ year }: FooterProps): any {
  return $("footer", [
    $("span", `copyright, ${year}`),
    $("a", { href: "https://example.com" }, "follow me"),
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

- `mount`: The first render.
- `update`: Every render after the first one.
- `render`: Every render. It's fired after `mount` or `update` events.
- `unmount`: Component has been unmounted.

Multiple event listeners can be attached to a single event. Specially useful to have more organized code.

```ts
import $, { Component, Props, State } from "untrue";

interface TimerState extends State {
  counter: number;
}

class Timer extends Component<Props, TimerState> {
  init(): void {
    this.state = { counter: 0 };

    let interval: number | undefined;

    // start interval on mount

    this.on("mount", () => {
      interval = setInterval((): void => {
        const { counter } = this.state;

        this.updateState({ counter: counter + 1 });
      }, 1000);
    });

    // clear interval on unmount

    this.on("unmount", (): void => {
      clearInterval(interval);
    });

    // check "counter" change on update

    this.on("update", (): void => {
      // this.props and this.prevProps are also available

      const { counter } = this.state;
      const { counter: prevCounter } = this.prevState!;

      if (counter !== prevCounter) {
        console.log("Counter has been updated.", { counter, prevCounter });
      }
    });
  }

  render(): any {
    const { counter } = this.state;

    return $("span", counter);
  }
}

interface AppState extends State {
  running: boolean;
}

class App extends Component<Props, AppState> {
  init(): void {
    this.state = { running: false };
  }

  onClick = (): void => {
    const { running } = this.state;

    this.updateState({ running: !running });
  };

  render(): any {
    const { running } = this.state;

    return [
      $(
        "button",
        { onclick: this.onClick },
        running ? "end timer" : "start timer"
      ),
      $("br"),
      running ? $(Timer) : null,
    ];
  }
}

export default App;
```

After the button click, the output HTML will be:

```html
<button>end timer</button>
<br />
<span>0</span>
```

A `console.log` happens every second because `interval` updates `counter` on every call.
