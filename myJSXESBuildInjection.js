"use strict";
export const MyJSXFactory = (type, props, ...children) => {
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
export const MyJSXFragmentFactory = (props) => props.children.join("");
