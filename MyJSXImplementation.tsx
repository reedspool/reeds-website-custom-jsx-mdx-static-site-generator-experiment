// Starting types derived by guessing from looking at React documentation
// https://react.dev/reference/react/createElement#createelement
export const MyJSXFactory = (
  type: keyof JSX.IntrinsicElements | Function,
  props: Record<string, any> | null,
  ...children: any[]
): string => {
  if (typeof type === "function") {
    return type({ ...props, children });
  }

  if (typeof type !== "string") {
    throw Error(
      `JSX Factory called with unknown 'type' of type "${typeof type}"`,
    );
  }

  if (type.match(/^[^a-z]/)) {
    throw Error(`Expected tagName for type, but got "${type}"`);
  }

  let attributes = "";

  if (props !== null) {
    attributes = Object.entries(props)
      .map(([name, value]) => ` ${name}="${value.toString()}"`)
      .join("");
  }

  let childrenHtml = "";

  if (Array.isArray(children)) {
    childrenHtml = children
      // I think we get a deeply nested array if we have a list of JSX elements as children
      // Like <div>Maybe text node too {" and maybe this kinda node "}<i></i><i></i></div>
      // Testing needed
      .flat()
      // I'm not sure if this ever happens
      .map((child) => (typeof child === "function" ? child() : child))
      .join("");
  }
  return `<${type}${attributes}>${childrenHtml}</${type}>`;
};

export const MyJSXFragmentFactory = (props: { children: any[] }): string =>
  props.children.join("");
