import { normalize } from 'path';
import { getBabelInputPlugin } from "@rollup/plugin-babel";
import { join, extname, dirname, basename } from "path";
import json from "@rollup/plugin-json";
import command from "rollup-plugin-command";
import copy from "recursive-copy";
import through from "through2";

function replacePlugin(config, name, plugin) {
  if (typeof name == 'string') {

  }

  if (typeof name == 'number') {
    config.plugins[name] = plugin;
  }

}

export default args => {
  const outDir = join(__dirname, "dist/tmp/widgets/ckeditor");
  const customPluginsPath = join(__dirname, "src/assets/plugins");
  const production = Boolean(args.configProduction);
  const result = args.configDefaultConfig;
  const [jsConfig, mJsConfig] = result;
  [jsConfig, mJsConfig].forEach((config, index) => {
    //https://zh-hans.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#manual-babel-setup
    const newBabelPlugin = getBabelInputPlugin({
      sourceMaps: !production,
      babelrc: false,
      babelHelpers: "bundled",
      plugins: ["@babel/plugin-proposal-class-properties"],
      overrides: [
        {
          test: /node_modules/,
          plugins: ["@babel/plugin-transform-flow-strip-types", "@babel/plugin-transform-react-jsx"]
        },
        {
          exclude: /node_modules/,
          "plugins": [
            ["@babel/plugin-transform-react-jsx", {
              "runtime": "automatic"
            }]
          ]
        }
      ]
    });

    replacePlugin(config, 9, newBabelPlugin);

    const onwarn = config.onwarn;
    config.onwarn = warning => {
      const ignoredWarnings = [
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/geometry/dist/Polygon.js',
        },
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/react-diagrams-routing/dist/link/PathFindingLinkFactory.js',
        },
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/react-diagrams-routing/dist/link/RightAngleLinkFactory.js',
        },
      ]

      // only show warning when code and path don't match
      // anything in above list of ignored warnings
      if (!ignoredWarnings.some(({ ignoredCode, ignoredPath }) => (
        warning.code === ignoredCode &&
        normalize(warning.importer).includes(normalize(ignoredPath))))
      ) {
        onwarn(warning);
      }
    };

    // Copying only on first step is enough
    if (index === 0) {
      config.plugins = [
        ...config.plugins,
        copyCKEditorDirToDist(outDir),
        copyCustomPlugins(customPluginsPath, outDir)
      ];
    }

    /* this step is required by sanitize-html library */
    config.plugins.push(json());
  });

  return result;
};

function copyCustomPlugins(pluginsPath, outDir) {
  return command([async () => copy(dirname(pluginsPath), outDir, { overwrite: true })]);
}

function copyCKEditorDirToDist(outDir) {
  return command([
    async () => {
      return copy(dirname(require.resolve("ckeditor4")), outDir, {
        transform: src => {
          /* we need to empty every single css (excluding editor and dialog) inside the folder to avoid duplicate bundling,
           because even if the file is not imported anywhere it will be compiled inside RichText.js and RichText.mjs */
          /* we need editor and dialog because it's required for loading styles on iframe elements (basically every dropdown,popup items from toolbar) */
          if (extname(src) === ".css" && !/(editor(_gecko)?|dialog).css/gi.test(basename(src))) {
            return through((chunk, enc, done) => done(null, ""));
          }
        },
        overwrite: true,
        // This list is not final, it's minimal working version, later we can exclude some folders from Plugin directory
        filter: [
          // we need lang because it's responsible for names and descriptions in toolbar and content in general
          "**/lang/**/*.*",
          // The look and feel of the CKEditor 4 user interface can be adjusted through skins (moono-lisa) is one of the defaults
          "**/skins/moono-lisa/**",
          // basically most of the items in toolbar are coming from plugins, specially if you choose full or standard version.
          "**/plugins/**/*.*",
          "**/ckeditor.js",
          "**/config.js",
          "**/styles.js",
          "**/contents.css"
        ]
      });
    }
  ]);
}