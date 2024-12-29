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
import $, { Hook } from "untrue";

function App() {
  const [counter, updateCounter] = Hook.useState(0);

  const onIncrement = () => {
    updateCounter(counter + 1);
  };

  // regular arrays are used to return a list of slots

  // after the first click, counter is no longer 0 but 1

  return [
    $("span", counter),
    $("button", { onclick: onIncrement }, "increment"),
  ];
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
import $, { Hook, Props } from "untrue";

function App() {
  return [
    $(Header, { title: "Untrue" }), // pass title as prop (external data)
    $(Footer, { year: 2049 }), // pass year as prop (external data)
  ];
}

interface HeaderProps extends Props {
  title: string;
}

function Header({ title }: HeaderProps) {
  const [counter, updateCounter] = Hook.useState(0); // internal data

  const onIncrement = () => {
    updateCounter(counter + 1);
  };

  return $("header", [
    $("h1", title),
    $("div", [
      $("span", counter),
      $("button", { onclick: onIncrement }, "increment"),
    ]),
  ]);
}

interface FooterProps extends Props {
  year: number;
}

function Footer({ year }: FooterProps) {
  return $("footer", [
    $("span", `copyright, ${year}`),
    $("br"),
    $("a", { href: "https://example.com" }, "some anchor link"),
  ]);
}

export default App;
```

The output HTML will be:

```html
<header>
  <h1>Untrue</h1>
  <div>
    <span>0</span>
    <button>increment</button>
  </div>
</header>
<footer>
  <span>copyright, 2049</span>
  <br />
  <a href="https://example.com">some anchor link</a>
</footer>
```

`Header` has some `counter` that will be updated with `button`.

### Lifecycle events

- `mount`: The first render.
- `update`: Every render after the first one.
- `render`: Every render. It's fired after `mount` or `update` events.
- `unmount`: Component has been unmounted.

Multiple event listeners can be attached to a single event. Specially useful to have more organized code.

```ts
import $, { Hook } from "untrue";

function App() {
  const [running, updateRunning] = Hook.useState(false);

  const onClick = () => {
    updateRunning(!running);
  };

  return [
    $("button", { onclick: onClick }, running ? "end timer" : "start timer"),
    $("br"),
    running ? $(Timer) : null,
  ];
}

function Timer() {
  const [counter, updateCounter] = Hook.useState(0);

  Hook.useMountLifecycle(() => {
    console.log("Timer mounted");
  });

  Hook.useUpdateLifecycle(() => {
    console.log("Timer updated");
  });

  Hook.useEffect(() => {
    const timeout = setTimeout(() => {
      updateCounter(counter + 1);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [counter]);

  return $("span", counter);
}

export default App;
```

After the button click, the output HTML will be:

```html
<button>end timer</button>
<br />
<span>0</span>
```

`counter` is incremented every second.

`Timer mounted` is logged first followed by `Timer updated` for updates.
