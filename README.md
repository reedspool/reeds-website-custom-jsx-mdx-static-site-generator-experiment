# Site Generator for Reed's Website

(In the future...) Live at https://reeds.website

## Usage

Still early development, so these operations are not well defined and in flux. This document may already be out of date. 

tl;dr: run 

```sh
npm run build:jsx && \ 
  npm run build:filebuilder && \
  npm run build:inject && \
  npm run build:css && \
  echo "Compilation done, running output" && \
  node tmp/out.mjs;
```

Steps explained:

### `npm run build:jsx` 

Compile JSX implementation from its source `MyJSXImplementation.tsx` to a `tmp/` JS file. If this output file is injected into a JSX file (or `.tsx`), it provides a JSX implementation that outputs a string which contains HTML.

The JSX implementation consists of two exports, `MyJSXFactory` and `MyJSXFragmentFactory` which respectively match what I wrote in my `tsconfig.json` entries `jsxFactory` and `jsxFragmentFactory`.

### `npm run build:filebuilder` 

Compile my MDX & JSX builder script from TypeScript to JavaScript I can run with `node`.

### `npm run build:inject`

Runs the "filebuilder" MDX & JSX builder script. Injects the JSX implementation into an output runnable JavaScript file.

### `node tmp/out.mjs`

Runs the output JavaScript file which produces HTML from the input JSX and MDX.

### `npm run build:css`

Compile Tailwind and the rest of CSS via PostCSS.
