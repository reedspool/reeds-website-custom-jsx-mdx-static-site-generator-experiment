import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import esbuild from "esbuild";
import chokidar from "chokidar";

console.log(`Running this script from CWD "${process.cwd()}"`);
const dataForPages = [
  {
    mdxSrc: "pages/index.mdx",
    output: "build/index.html",
    layout: "BlogLayout",
  },
];

// Collect data for all posts
for (const inputFileName of await readdir("posts")) {
  if (!inputFileName.endsWith(".mdx")) continue;
  dataForPages.push({
    mdxSrc: `./posts/${inputFileName}`,
    output: `build/${inputFileName.replace(/\.mdx$/, "")}.html`,
    layout: "GenericPageBody",
  });
}

console.log("Collected data for all compilation sources:\n", dataForPages);

let compilations = 0;
async function compilePage(data: (typeof dataForPages)[number]) {
  const { mdxSrc, output, layout } = data;
  const tmpDir = resolve(dirname("./tmp/" + mdxSrc));
  const mdxOutputPath = `./tmp/${mdxSrc}.tsx`;

  const uniqueName = `fileBuilderFor${basename(mdxSrc)}_${++compilations}`;
  const fileBuilderTsxInputName = `${tmpDir}/${uniqueName}.tsx`;
  const fileBuilderTsxOutputName = `${tmpDir}/${uniqueName}.mjs`;

  // If the mdxSrc is from `pages/my.mdx`, then ensure there is a directory
  // `tmp/pages/`
  await mkdir(tmpDir, { recursive: true });
  console.log(`Compiling MDX '${mdxSrc}' to '${mdxOutputPath}'`);
  let promiseForMdxToTsxTranspilationComplete = compile(
    await readFile(mdxSrc),
    {
      jsx: true,
      elementAttributeNameCase: "html",
    },
  ).then(async (result) => {
    await writeFile(
      mdxOutputPath,
      "// @ts-nocheck\n" + result.value.toString().replace(/\/\*@jsx.*\n/, ""),
    );
  });

  const fileContents = `import MDXFile from "./${basename(
    mdxOutputPath,
  ).replace(".tsx", "")}";
import type { MDXProps } from "staticPageBuildingStuff";
import * as Stuff from "staticPageBuildingStuff";
const {
  CommonPage,
  Future,
  Link,
  HashTarget,
  GitHubLink,
  mkdir,
  writeFile,
} = Stuff;

// This matches the type of the import when I change from no file suffix to
//      .mdx
const ReTypedMDXFile: (props: MDXProps) => JSX.Element = MDXFile;

await mkdir("./build", { recursive: true });

await writeFile(
  "${output}",
  (
    <CommonPage>
      <Stuff.${layout}>
        <ReTypedMDXFile components={{ Link, HashTarget, GitHubLink, Future }} />
      </Stuff.${layout}>
    </CommonPage>
  ).toString(),
);
`;

  console.log(
    `Writing dynamic page building TSX script to '${fileBuilderTsxInputName}'`,
  );
  let promiseForDynamicTsxPageBuilderWritingComplete = writeFile(
    fileBuilderTsxInputName,
    fileContents,
  );

  await Promise.all([
    promiseForMdxToTsxTranspilationComplete,
    promiseForDynamicTsxPageBuilderWritingComplete,
  ]);

  console.log(
    `Using esbuild to compile TSX '${fileBuilderTsxInputName}' to '${fileBuilderTsxOutputName}'`,
  );
  await esbuild.build({
    entryPoints: [fileBuilderTsxInputName],
    bundle: true,
    target: "esnext",
    format: "esm",
    platform: "node",
    outfile: fileBuilderTsxOutputName,
    inject: ["tmp/MyJSXImplementation.js"],
    plugins: [],
  });

  console.log(`Running ${fileBuilderTsxOutputName}`);
  await import(fileBuilderTsxOutputName);
}

const allCompilations = [];
for (let index = 0; index < dataForPages.length; index++) {
  const data = dataForPages[index];
  if (!data) throw new Error("malformed data");
  allCompilations.push(compilePage(data));
}

await Promise.all(allCompilations);
console.log("Finished compilation");

if (!process.argv.includes("--watch")) {
  process.exit(0);
}

console.log("Watching all input files, rebuilding");
const watcher = chokidar.watch(dataForPages.map(({ mdxSrc }) => mdxSrc));

const dataWithResolvedSrc = dataForPages.map((d) => ({
  ...d,
  resolvedMdxSrc: resolve(d.mdxSrc),
}));

watcher.on("change", (path) => {
  const resolvedPath = resolve(path);
  const d = dataWithResolvedSrc.find((d) => d.resolvedMdxSrc === resolvedPath);
  if (!d)
    throw new Error(`Caught watching a path I can't recompile: '${path}'`);
  console.log(`Rebuilding ${d.mdxSrc}`);
  compilePage(d);
});
