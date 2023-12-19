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
  {
    pageJsxOrTsxSrc: "pages/log-game.tsx",
    output: "build/log-game.html",
    layout: "EmptyLayout",
  },
  {
    clientSrc: "src/log-game-client.jsx",
    output: "build/log-game-client.js",
  },
  {
    // NOTE: Running this file also writes out other feeds
    pageJsxOrTsxSrc: "pages/feed.tsx",
    output: "build/feed.html",
    layout: "GenericPageBody",
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
async function compilePageFromMdx({
  mdxSrc,
  output,
  layout,
}: (typeof dataForPages)[number]) {
  if (!mdxSrc) throw new Error(`No MDX to compile for ${output}`);
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
    inject: ["tmp/MyJSXStringImplementation.js"],
    plugins: [],
  });

  console.log(`Running ${fileBuilderTsxOutputName}`);
  await import(fileBuilderTsxOutputName);
}

async function compileClientJs({
  clientSrc,
  output,
}: (typeof dataForPages)[number]) {
  if (!clientSrc) throw new Error(`Cannot compile ${output}, no client source`);

  console.log(`Using esbuild to compile client '${clientSrc}' to '${output}'`);
  await esbuild.build({
    entryPoints: [clientSrc],
    bundle: true,
    target: "esnext",
    format: "esm",
    platform: "node",
    outfile: output,
    inject: ["tmp/MyJSXBrowserImplementation.js"],
    plugins: [],
  });
}

async function compilePageFromJsxOrTsx({
  pageJsxOrTsxSrc,
  output,
  layout,
}: (typeof dataForPages)[number]) {
  if (!pageJsxOrTsxSrc)
    throw new Error(`No Page JSX or TSX to compile for ${output}`);

  const tmpDir = resolve(dirname("./tmp/" + pageJsxOrTsxSrc));

  const uniqueName = `fileBuilderFor${basename(
    pageJsxOrTsxSrc,
  )}_${++compilations}`;
  const fileBuilderTsxInputName = `${tmpDir}/${uniqueName}.tsx`;
  const fileBuilderTsxOutputName = `${tmpDir}/${uniqueName}.mjs`;

  // If the pageJsxOrTsxSrc is from `pages/my.mdx`, then ensure there is a directory
  // `tmp/pages/`
  await mkdir(tmpDir, { recursive: true });

  const fileContents = `import { Body } from "../../${pageJsxOrTsxSrc.replace(
    ".tsx",
    "",
  )}";
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

await mkdir("./build", { recursive: true });

await writeFile(
  "${output}",
  (
    <CommonPage>
      <Stuff.${layout}>
        <Body components={{ Link, HashTarget, GitHubLink, Future }} />
      </Stuff.${layout}>
    </CommonPage>
  ).toString(),
);
`;

  console.log(
    `Writing dynamic page building TSX script to '${fileBuilderTsxInputName}'`,
  );
  await writeFile(fileBuilderTsxInputName, fileContents);

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
    inject: ["tmp/MyJSXStringImplementation.js"],
    plugins: [],
  });

  console.log(`Running ${fileBuilderTsxOutputName}`);
  await import(fileBuilderTsxOutputName);
}

const dispatchCompilation = (
  data: (typeof dataForPages)[number],
): Promise<unknown> => {
  if (data.mdxSrc) {
    return compilePageFromMdx(data);
  } else if (data.clientSrc) {
    return compileClientJs(data);
  } else if (data.pageJsxOrTsxSrc) {
    return compilePageFromJsxOrTsx(data);
  } else {
    throw new Error(
      `Not sure what to do with data for page ${JSON.stringify(data)}`,
    );
  }
};

const allCompilations = [];
for (let index = 0; index < dataForPages.length; index++) {
  const data = dataForPages[index];
  if (!data) throw new Error("malformed data");
  allCompilations.push(dispatchCompilation(data));
}

await Promise.all(allCompilations);
console.log("Finished compilation");

if (!process.argv.includes("--watch")) {
  process.exit(0);
}

console.log("Watching all input files, rebuilding");
const watcher = chokidar.watch(
  dataForPages
    .map(
      ({ mdxSrc, clientSrc, pageJsxOrTsxSrc }) =>
        mdxSrc || clientSrc || pageJsxOrTsxSrc || "",
    )
    .filter((a) => a),
);

const dataWithResolvedSrc = dataForPages.map((d) => ({
  ...d,
  resolvedSrc: resolve(d.mdxSrc || d.clientSrc || d.pageJsxOrTsxSrc || ""),
}));

watcher.on("change", (path) => {
  const resolvedPath = resolve(path);
  const d = dataWithResolvedSrc.find((d) => d.resolvedSrc === resolvedPath);
  if (!d)
    throw new Error(`Caught watching a path I can't recompile: '${path}'`);
  console.log(`Rebuilding ${d.mdxSrc}`);
  dispatchCompilation(d);
});
