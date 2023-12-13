import { readFile, writeFile } from "node:fs/promises";
import { compile } from "@mdx-js/mdx";
import esbuild from "esbuild";

const result = await compile(await readFile("pages/index.mdx"), {
  jsx: true,
  elementAttributeNameCase: "html",
});

await writeFile(
  "./tmp/MDXCompileOutput.tsx",
  "// @ts-nocheck\n" + result.value.toString().replace(/\/\*@jsx.*\n/, ""),
);

await esbuild.build({
  entryPoints: ["index.tsx"],
  bundle: true,
  target: "esnext",
  format: "esm",
  platform: "node",
  outfile: "tmp/out.mjs",
  inject: ["tmp/MyJSXImplementation.js"],
  plugins: [],
});
