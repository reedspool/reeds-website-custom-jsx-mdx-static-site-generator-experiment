import { readFile, writeFile } from "node:fs/promises";
p;
import { compile } from "@mdx-js/mdx";
import esbuild from "esbuild";

(async () => {
  const result = await compile(await readFile("index.mdx"), {
    jsx: true,
    elementAttributeNameCase: "html",
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
