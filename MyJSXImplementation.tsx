// Starting types derived by guessing from looking at React documentation
// https://react.dev/reference/react/createElement#createelement
export const MyJSXFactory = (
  type: string | Function,
  props: Record<string, any> | null,
  ...children: any[]
) => {
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

  return `<${type}${attributes}>${children}</${type}>`;
};

export const MyJSXFragmentFactory = (props: { children: any[] }) =>
  props.children.join("");
