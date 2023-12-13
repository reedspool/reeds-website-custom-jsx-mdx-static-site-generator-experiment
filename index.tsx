import MDXFile from "./tmp/MDXCompileOutput";
import { CommonPage } from "./CommonPage";
import { Link, HashTarget, GitHubLink } from "./components/Link";
import { Future } from "./components/Future";
import type { MDXProps } from "mdx/types";

// This matches the type of the import when I change from no file suffix to `.mdx`
const ReTypedMDXFile: (props: MDXProps) => JSX.Element = MDXFile;

console.log(
  <CommonPage>
    <ReTypedMDXFile components={{ Link, HashTarget, GitHubLink, Future }} />
  </CommonPage>,
);
