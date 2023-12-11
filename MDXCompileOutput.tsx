// @ts-nocheck
export const A = () => <div>Hello</div>;
function _createMdxContent(props) {
  const _components = {
    h1: "h1",
    ...props.components
  };
  return <><_components.h1>{"My test MDX"}</_components.h1>{"\n"}{"\n"}<A>{"You shouldn't see this"}</A></>;
}
export default function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
