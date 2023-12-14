import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import esbuild from "esbuild";

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
  console.log("inputFileName", inputFileName);
  if (!inputFileName.endsWith(".mdx")) continue;
  dataForPages.push({
    mdxSrc: `./posts/${inputFileName}`,
    output: `build/${inputFileName.replace(/\.mdx$/, "")}.html`,
    layout: "GenericPageBody",
  });
}

console.log("dataForPages", dataForPages);

for (let index = 0; index < dataForPages.length; index++) {
  const data = dataForPages[index];
  if (!data) throw new Error("malformed data");
  const { mdxSrc, output, layout } = data;
  const tmpDir = resolve(dirname("./tmp/" + mdxSrc));
  const mdxOutputPath = `./tmp/${mdxSrc}.tsx`;

  const fileBuilderTsxInputName = `${tmpDir}/fileBuilder${index}.tsx`;
  const fileBuilderTsxOutputName = `${tmpDir}/fileBuilder${index}.mjs`;
  const fileBuilderTsxOutputClassHackName = `${tmpDir}/fileBuilder${index}ClassHack.mjs`;

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

  console.log(`Changing all instances of "class:" to "'class':"`);
  const contentBuffer = await readFile(fileBuilderTsxOutputName);

  await writeFile(fileBuilderTsxOutputClassHackName, contentBuffer.toString());
  console.log(`Running ${fileBuilderTsxOutputClassHackName}`);
  await import(fileBuilderTsxOutputClassHackName);
}
