import { readFile, writeFile } from "node:fs/promises";
import * as mdx from "@mdx-js/mdx";
import esbuild from "esbuild";

(async () => {
  const compile = mdx.compile;

  const result = await compile(await readFile("index.mdx"), {
    jsx: true,
  });

  await writeFile(
    "./MDXCompileOutput.tsx",
    "// @ts-nocheck\n" + result.value.replace(/\/\*@jsx.*\n/, ""),
  );
  await esbuild.build({
    entryPoints: ["index.tsx"],
    bundle: true,
    target: "esnext",
    outfile: "out.js",
    inject: ["myJSXESBuildInjection.js"],
    plugins: [],
  });
})();
