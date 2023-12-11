"use strict";
(() => {
  // myJSXESBuildInjection.js
  var MyJSXFactory = (type, props, ...children) => {
    if (typeof type === "function") {
      return type({ ...props, children });
    }
    if (typeof type !== "string") {
      throw Error(
        `JSX Factory called with unknown 'type' of type "${typeof type}"`
      );
    }
    if (type.match(/^[^a-z]/)) {
      throw Error(`Expected tagName for type, but got "${type}"`);
    }
    let attributes = "";
    if (props !== null) {
      attributes = Object.entries(props).map(([name, value]) => ` ${name}="${value.toString()}"`).join("");
    }
    return `<${type}${attributes}>${children}</${type}>`;
  };
  var MyJSXFragmentFactory = (props) => props.children.join("");

  // MDXCompileOutput.tsx
  var A = () => /* @__PURE__ */ MyJSXFactory("div", null, "Hello");
  function _createMdxContent(props) {
    const _components = {
      h1: "h1",
      ...props.components
    };
    return /* @__PURE__ */ MyJSXFactory(MyJSXFragmentFactory, null, /* @__PURE__ */ MyJSXFactory(_components.h1, null, "My test MDX"), "\n", "\n", /* @__PURE__ */ MyJSXFactory(A, null, "You shouldn't see this"));
  }
  function MDXContent(props = {}) {
    const { wrapper: MDXLayout } = props.components || {};
    return MDXLayout ? /* @__PURE__ */ MyJSXFactory(MDXLayout, { ...props }, /* @__PURE__ */ MyJSXFactory(_createMdxContent, { ...props })) : _createMdxContent(props);
  }

  // index.tsx
  var HelloWorld = () => /* @__PURE__ */ MyJSXFactory("h1", null, "Hello World!");
  console.log(/* @__PURE__ */ MyJSXFactory(HelloWorld, null));
  console.log(/* @__PURE__ */ MyJSXFactory(MDXContent, null));
})();
