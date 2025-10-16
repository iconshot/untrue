import { Component, Props } from "../Stateful/Component";

import { Ref } from "../Ref";

import { Children, ClassComponent, FunctionComponent, Slot } from "./Slot";

type BaseAttributes = {
  id: string;
  class: string;
  title: string;
  style: string;
  hidden: string;
  tabIndex: string;
  accessKey: string;
  draggable: string;
  spellcheck: string;
  lang: string;
  dir: "ltr" | "rtl" | "auto";
  part: string;
  slot: string;
  translate: "yes" | "no";
  inert: string;
  inputMode: string;
  contentEditable: string;
  enterKeyHint: string;
  popover: string;
  autocapitalize: string;
  autofocus: string;
  is: string;
  exportparts: string;
  exportpartsmap: string;

  [key: `data-${string}`]: string;
  [key: `aria-${string}`]: string;

  onclick: (event: MouseEvent) => any;
  ondblclick: (event: MouseEvent) => any;
  onmousedown: (event: MouseEvent) => any;
  onmouseup: (event: MouseEvent) => any;
  onmouseenter: (event: MouseEvent) => any;
  onmouseleave: (event: MouseEvent) => any;
  onmousemove: (event: MouseEvent) => any;
  oncontextmenu: (event: MouseEvent) => any;
  onkeydown: (event: KeyboardEvent) => any;
  onkeyup: (event: KeyboardEvent) => any;
  oninput: (event: InputEvent) => any;
  onchange: (event: Event) => any;
  onfocus: (event: FocusEvent) => any;
  onblur: (event: FocusEvent) => any;
  ondrag: (event: DragEvent) => any;
  ondragstart: (event: DragEvent) => any;
  ondragend: (event: DragEvent) => any;
  ondragenter: (event: DragEvent) => any;
  ondragleave: (event: DragEvent) => any;
  ondragover: (event: DragEvent) => any;
  ondrop: (event: DragEvent) => any;
  onwheel: (event: WheelEvent) => any;
  onscroll: (event: Event) => any;
};

type ElementMap = {
  div: {
    element: HTMLDivElement;
    attributes: {};
  };
  span: {
    element: HTMLSpanElement;
    attributes: {};
  };
  img: {
    element: HTMLImageElement;
    attributes: {
      src: string;
      alt: string;
      width: string;
      height: string;
      loading: "eager" | "lazy";
      decoding: "sync" | "async" | "auto";
      referrerPolicy: string;
      crossOrigin: "anonymous" | "use-credentials" | "";
      fetchpriority: "high" | "low" | "auto";

      onload: (event: Event) => any;
      onerror: (event: Event) => any;
    };
  };
  input: {
    element: HTMLInputElement;
    attributes: {
      type: string;
      value: string;
      checked: string;
      placeholder: string;
      disabled: string;
      readonly: string;
      required: string;
      name: string;
      min: string;
      max: string;
      step: string;
      pattern: string;
      multiple: string;
      accept: string;
      autofocus: string;
      autocomplete: string;
      list: string;
      size: string;
      minlength: string;
      maxlength: string;

      oninput: (event: InputEvent) => any;
      onchange: (event: Event) => any;
    };
  };
  button: {
    element: HTMLButtonElement;
    attributes: {
      type: "button" | "submit" | "reset";
      disabled: string;
      name: string;
      value: string;
      autofocus: string;
      form: string;
    };
  };
  a: {
    element: HTMLAnchorElement;
    attributes: {
      href: string;
      target: "_self" | "_blank" | "_parent" | "_top";
      download: string;
      rel: string;
      hreflang: string;
      referrerPolicy: string;
    };
  };
  video: {
    element: HTMLVideoElement;
    attributes: {
      src: string;
      autoplay: string;
      controls: string;
      loop: string;
      muted: string;
      playsinline: string;
      poster: string;
      preload: "none" | "metadata" | "auto";
      width: string;
      height: string;
      crossOrigin: "anonymous" | "use-credentials" | "";
      controlslist: string;

      onloadstart: (event: Event) => any;
      onloadedmetadata: (event: Event) => any;
      onloadeddata: (event: Event) => any;
      oncanplay: (event: Event) => any;
      oncanplaythrough: (event: Event) => any;
      onplay: (event: Event) => any;
      onpause: (event: Event) => any;
      onended: (event: Event) => any;
      ontimeupdate: (event: Event) => any;
      onvolumechange: (event: Event) => any;
      onseeking: (event: Event) => any;
      onseeked: (event: Event) => any;
      onwaiting: (event: Event) => any;
      onstalled: (event: Event) => any;
      onerror: (event: Event) => any;
    };
  };
  audio: {
    element: HTMLAudioElement;
    attributes: {
      src: string;
      autoplay: string;
      controls: string;
      loop: string;
      muted: string;
      preload: "none" | "metadata" | "auto";
      crossOrigin: "anonymous" | "use-credentials" | "";

      onloadstart: (event: Event) => any;
      onloadedmetadata: (event: Event) => any;
      onloadeddata: (event: Event) => any;
      oncanplay: (event: Event) => any;
      oncanplaythrough: (event: Event) => any;
      onplay: (event: Event) => any;
      onpause: (event: Event) => any;
      onended: (event: Event) => any;
      ontimeupdate: (event: Event) => any;
      onvolumechange: (event: Event) => any;
      onseeking: (event: Event) => any;
      onseeked: (event: Event) => any;
      onwaiting: (event: Event) => any;
      onstalled: (event: Event) => any;
      onerror: (event: Event) => any;
    };
  };
  form: {
    element: HTMLFormElement;
    attributes: {
      action: string;
      method: "get" | "post";
      enctype: string;
      target: string;
      autocomplete: "on" | "off";
      novalidate: string;

      onsubmit: (event: SubmitEvent) => any;
      onreset: (event: Event) => any;
    };
  };
  label: {
    element: HTMLLabelElement;
    attributes: {
      for: string;
    };
  };
  textarea: {
    element: HTMLTextAreaElement;
    attributes: {
      name: string;
      rows: string;
      cols: string;
      placeholder: string;
      disabled: string;
      readonly: string;
      required: string;
      maxlength: string;
      minlength: string;
      wrap: "hard" | "soft" | "off";

      oninput: (event: InputEvent) => any;
      onchange: (event: Event) => any;
    };
  };
  select: {
    element: HTMLSelectElement;
    attributes: {
      name: string;
      multiple: string;
      size: string;
      disabled: string;
      required: string;

      onchange: (event: Event) => any;
    };
  };
  option: {
    element: HTMLOptionElement;
    attributes: {
      value: string;
      label: string;
      disabled: string;
      selected: string;
    };
  };
};

type AllOptional<T> = {
  [K in keyof T]?: T[K] | null;
};

type AreAllKeysOptional<T> = {} extends T ? true : false;

type Attributes<T, K> = K & {
  key?: any;
} & (T extends null ? {} : { ref?: Ref<T> | null });

type AttributesOfClass<U extends ClassComponent<any>> = U extends new (
  props: infer P extends Props
) => Component<Props>
  ? Omit<P, "children">
  : never;

type AttributesOfFunction<U extends FunctionComponent<any>> = U extends (
  props: infer P extends Props
) => any
  ? Omit<P, "children">
  : never;

type AttributesOfElement<U extends keyof ElementMap> = AllOptional<
  BaseAttributes & ElementMap[U]["attributes"] & AttributesOf<null>
>;

type RefValueOf<U> = U extends ClassComponent<any>
  ? InstanceType<U>
  : U extends keyof ElementMap
  ? ElementMap[U]["element"]
  : null;

type AttributesOf<U> = U extends ClassComponent<any>
  ? AttributesOfClass<U>
  : U extends FunctionComponent<any>
  ? AttributesOfFunction<U>
  : U extends keyof ElementMap
  ? AttributesOfElement<U>
  : U extends null
  ? Record<string, any>
  : null;

type NotInElementMap<U extends string> = U extends keyof ElementMap ? never : U;

function $<
  U extends
    | ClassComponent<any>
    | FunctionComponent<any>
    | keyof ElementMap
    | null
>(
  contentType: U,
  attributes: Attributes<RefValueOf<U>, AttributesOf<U>>,
  children?: Children
): Slot;
function $<
  U extends
    | ClassComponent<any>
    | FunctionComponent<any>
    | keyof ElementMap
    | null
>(
  contentType: U,
  ...args: AreAllKeysOptional<AttributesOf<U>> extends true
    ? [children?: Children]
    : never
): Slot;
function $<U extends string>(
  contentType: NotInElementMap<U>,
  attributes: Attributes<Element, AttributesOf<null>>,
  children?: Children
): Slot;
function $<U extends string>(
  contentType: NotInElementMap<U>,
  children?: Children
): Slot;
function $(contentType: any, ...args: any[]): Slot {
  let attributes: any = null;

  let children: any[] = [];

  switch (args.length) {
    case 0: {
      break;
    }

    case 1: {
      if (Array.isArray(args[0])) {
        children = args[0];
      } else if (args[0] instanceof Slot) {
        children = [args[0]];
      } else if (args[0] !== null && typeof args[0] === "object") {
        attributes = args[0];
      } else {
        children = [args[0]];
      }

      break;
    }

    default: {
      attributes = args[0];

      children = Array.isArray(args[1]) ? args[1] : [args[1]];

      break;
    }
  }

  const isClass =
    typeof contentType === "function" &&
    /^class\s/.test(Function.prototype.toString.call(contentType));

  if (
    !(
      contentType === null ||
      (isClass &&
        (contentType.prototype === Component ||
          contentType.prototype instanceof Component)) ||
      (!isClass && typeof contentType === "function") ||
      typeof contentType === "string"
    )
  ) {
    throw new Error(
      "Content type must be a class component, function component, string or null."
    );
  }

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    throw new Error("Attributes must be object or null.");
  }

  return new Slot(contentType, attributes, children);
}

export default $;
