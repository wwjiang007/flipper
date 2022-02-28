/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// @ts-ignore
import Metro from 'metro';
// provided by Metro
// @ts-ignore
// eslint-disable-next-line
import MetroResolver from 'metro-resolver';
import tmp from 'tmp';
import path from 'path';
import fs from 'fs-extra';
import {spawn} from 'promisify-child-process';
import {
  getWatchFolders,
  runBuild,
  stripSourceMapComment,
} from 'flipper-pkg-lib';
import getAppWatchFolders from './get-app-watch-folders';
import {getSourcePlugins, getPluginSourceFolders} from 'flipper-plugin-lib';
import type {
  BundledPluginDetails,
  InstalledPluginDetails,
} from 'flipper-common';
import {
  appDir,
  staticDir,
  defaultPluginsDir,
  babelTransformationsDir,
  serverDir,
  rootDir,
  browserUiDir,
  serverCoreDir,
} from './paths';
import pFilter from 'p-filter';
import child from 'child_process';
import pMap from 'p-map';

// eslint-disable-next-line flipper/no-relative-imports-across-packages
const {version} = require('../package.json');

const dev = process.env.NODE_ENV !== 'production';

// For insiders builds we bundle top 5 popular device plugins,
// plus top 10 popular "universal" plugins enabled by more than 100 users.
const hardcodedPlugins = new Set<string>([
  // Popular device plugins
  'DeviceLogs',
  'CrashReporter',
  'MobileBuilds',
  'Hermesdebuggerrn',
  'React',
  // Popular client plugins
  'Inspector',
  'Network',
  'AnalyticsLogging',
  'GraphQL',
  'UIPerf',
  'MobileConfig',
  'Databases',
  'FunnelLogger',
  'Navigation',
  'Fresco',
  'Preferences',
]);

export function die(err: Error) {
  console.error('Script termnated.', err);
  process.exit(1);
}

export async function prepareDefaultPlugins(isInsidersBuild: boolean = false) {
  console.log(
    `⚙️  Preparing default plugins (isInsidersBuild=${isInsidersBuild})...`,
  );
  await fs.emptyDir(defaultPluginsDir);
  const forcedDefaultPluginsDir = process.env.FLIPPER_DEFAULT_PLUGINS_DIR;
  if (forcedDefaultPluginsDir) {
    console.log(
      `⚙️  Copying the provided default plugins dir "${forcedDefaultPluginsDir}"...`,
    );
    await fs.copy(forcedDefaultPluginsDir, defaultPluginsDir, {
      recursive: true,
      overwrite: true,
      dereference: true,
    });
    console.log('✅  Copied the provided default plugins dir.');
    await generateDefaultPluginEntryPoints([]); // calling it here just to generate empty indexes
  } else {
    const sourcePlugins = process.env.FLIPPER_NO_DEFAULT_PLUGINS
      ? []
      : await getSourcePlugins();
    const defaultPlugins = sourcePlugins
      // we only include predefined set of plugins into insiders release
      .filter((p) => !isInsidersBuild || hardcodedPlugins.has(p.id));
    if (process.env.FLIPPER_NO_BUNDLED_PLUGINS) {
      await buildDefaultPlugins(defaultPlugins);
      await generateDefaultPluginEntryPoints([]); // calling it here just to generate empty indexes
    } else {
      await generateDefaultPluginEntryPoints(defaultPlugins);
    }
  }
  console.log('✅  Prepared default plugins.');
}

function getGeneratedIndex(pluginRequires: string) {
  return `
  /* eslint-disable */
  // THIS FILE IS AUTO-GENERATED by function "generateDefaultPluginEntryPoints" in "build-utils.ts".

  declare const require: any;

  // This function exists to make sure that if one require fails in its module initialisation, not everything fails
  function tryRequire(module: string, fn: () => any): any {
    try {
      return fn();
    } catch (e) {
      console.error(\`Could not require \${module}: \`, e)
      return {};
    }
  }

  export default {\n${pluginRequires}\n} as any
  `;
}

async function generateDefaultPluginEntryPoints(
  defaultPlugins: InstalledPluginDetails[],
) {
  console.log(
    `⚙️  Generating entry points for ${defaultPlugins.length} bundled plugins...`,
  );
  const bundledPlugins = defaultPlugins.map(
    (p) =>
      ({
        ...p,
        isBundled: true,
        version: p.version === '0.0.0' ? version : p.version,
        flipperSDKVersion:
          p.flipperSDKVersion === '0.0.0' ? version : p.flipperSDKVersion,
        dir: undefined,
        entry: undefined,
        serverAddOnEntry: undefined,
      } as BundledPluginDetails),
  );
  await fs.writeJSON(
    path.join(defaultPluginsDir, 'bundled.json'),
    bundledPlugins,
  );
  const pluginRequires = bundledPlugins
    .map(
      (x) =>
        `  '${x.name}': tryRequire('${x.name}', () => require('${x.name}'))`,
    )
    .join(',\n');
  const generatedIndex = getGeneratedIndex(pluginRequires);
  await fs.ensureDir(path.join(appDir, 'src', 'defaultPlugins'));
  await fs.writeFile(
    path.join(appDir, 'src', 'defaultPlugins', 'index.tsx'),
    generatedIndex,
  );
  await fs.ensureDir(path.join(browserUiDir, 'src', 'defaultPlugins'));
  await fs.writeFile(
    path.join(browserUiDir, 'src', 'defaultPlugins', 'index.tsx'),
    generatedIndex,
  );

  const serverAddOns = defaultPlugins.filter(
    ({serverAddOnSource}) => !!serverAddOnSource,
  );
  if (serverAddOns.length) {
    const serverAddOnRequires = serverAddOns
      .map(
        (x) =>
          `  '${x.name}': tryRequire('${x.serverAddOnSource}', () => require('${x.serverAddOnSource}'))`,
      )
      .join(',\n');
    const generatedIndexServerAddOns = getGeneratedIndex(serverAddOnRequires);
    await fs.ensureDir(path.join(serverCoreDir, 'src', 'defaultPlugins'));
    await fs.writeFile(
      path.join(serverCoreDir, 'src', 'defaultPlugins', 'index.tsx'),
      generatedIndexServerAddOns,
    );
  }

  console.log('✅  Generated bundled plugin entry points.');
}

async function buildDefaultPlugins(defaultPlugins: InstalledPluginDetails[]) {
  if (process.env.FLIPPER_NO_REBUILD_PLUGINS) {
    console.log(
      `⚙️  Including ${
        defaultPlugins.length
      } plugins into the default plugins list. Skipping rebuilding because "no-rebuild-plugins" option provided. List of default plugins: ${defaultPlugins
        .map((p) => p.id)
        .join(', ')}`,
    );
  }
  await pMap(
    defaultPlugins,
    async function (plugin) {
      try {
        if (!process.env.FLIPPER_NO_REBUILD_PLUGINS) {
          console.log(
            `⚙️  Building plugin ${plugin.id} to include it into the default plugins list...`,
          );
          await runBuild(plugin.dir, dev);
        }
        await fs.ensureSymlink(
          plugin.dir,
          path.join(defaultPluginsDir, plugin.name),
          'junction',
        );
      } catch (err) {
        console.error(`✖ Failed to build plugin ${plugin.id}`, err);
      }
    },
    {
      concurrency: 16,
    },
  );
}

const minifierConfig = {
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    // see: https://www.npmjs.com/package/terser
    keep_fnames: true,
    module: true,
    warnings: true,
    mangle: false,
    compress: false,
  },
};

async function compile(
  buildFolder: string,
  projectRoot: string,
  watchFolders: string[],
  entry: string,
) {
  const out = path.join(buildFolder, 'bundle.js');
  await Metro.runBuild(
    {
      reporter: {update: () => {}},
      projectRoot,
      watchFolders,
      serializer: {},
      transformer: {
        babelTransformerPath: path.join(
          babelTransformationsDir,
          'transform-app',
        ),
        ...minifierConfig,
      },
      resolver: {
        resolverMainFields: ['flipperBundlerEntry', 'module', 'main'],
        blacklistRE: /\.native\.js$/,
        sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'],
      },
    },
    {
      dev,
      minify: !dev,
      resetCache: !dev,
      sourceMap: true,
      sourceMapUrl: dev ? 'bundle.map' : undefined,
      inlineSourceMap: false,
      entry,
      out,
    },
  );
  if (!dev) {
    stripSourceMapComment(out);
  }
}

export async function compileRenderer(buildFolder: string) {
  console.log(`⚙️  Compiling renderer bundle...`);
  const watchFolders = [
    ...(await getAppWatchFolders()),
    ...(await getPluginSourceFolders()),
  ];
  try {
    await compile(
      buildFolder,
      appDir,
      watchFolders,
      path.join(appDir, 'src', 'init.tsx'),
    );
    console.log('✅  Compiled renderer bundle.');
  } catch (err) {
    die(err);
  }
}

export async function moveSourceMaps(
  buildFolder: string,
  sourceMapFolder: string | undefined,
) {
  console.log(`⚙️  Moving source maps...`);
  const mainBundleMap = path.join(buildFolder, 'bundle.map');
  const rendererBundleMap = path.join(staticDir, 'main.bundle.map');
  if (sourceMapFolder) {
    await fs.ensureDir(sourceMapFolder);
    await fs.move(mainBundleMap, path.join(sourceMapFolder, 'bundle.map'), {
      overwrite: true,
    });
    await fs.move(
      rendererBundleMap,
      path.join(sourceMapFolder, 'main.bundle.map'),
      {overwrite: true},
    );
    console.log(`✅  Moved to ${sourceMapFolder}.`);
  } else {
    // If we don't move them out of the build folders, they'll get included in the ASAR
    // which we don't want.
    await fs.remove(mainBundleMap);
    await fs.remove(rendererBundleMap);
    console.log(`⏭  Removing source maps.`);
  }
}

export async function compileMain() {
  const out = path.join(staticDir, 'main.bundle.js');
  process.env.FLIPPER_ELECTRON_VERSION =
    require('electron/package.json').version;
  console.log('⚙️  Compiling main bundle...');
  try {
    const config = Object.assign({}, await Metro.loadConfig(), {
      reporter: {update: () => {}},
      projectRoot: staticDir,
      watchFolders: await getWatchFolders(staticDir),
      transformer: {
        babelTransformerPath: path.join(
          babelTransformationsDir,
          'transform-main',
        ),
        ...minifierConfig,
      },
      resolver: {
        sourceExts: ['tsx', 'ts', 'js'],
        resolverMainFields: ['flipperBundlerEntry', 'module', 'main'],
        blacklistRE: /\.native\.js$/,
      },
    });
    await Metro.runBuild(config, {
      platform: 'web',
      entry: path.join(staticDir, 'main.tsx'),
      out,
      dev,
      minify: !dev,
      sourceMap: true,
      sourceMapUrl: dev ? 'main.bundle.map' : undefined,
      inlineSourceMap: false,
      resetCache: !dev,
    });
    console.log('✅  Compiled main bundle.');
    if (!dev) {
      stripSourceMapComment(out);
    }
  } catch (err) {
    die(err);
  }
}
export function buildFolder(): Promise<string> {
  // eslint-disable-next-line no-console
  console.log('Creating build directory');
  return new Promise<string>((resolve, reject) => {
    tmp.dir({prefix: 'flipper-build-'}, (err, buildFolder) => {
      if (err) {
        reject(err);
      } else {
        resolve(buildFolder);
      }
    });
  }).catch((e) => {
    die(e);
    return '';
  });
}
export function getVersionNumber(buildNumber?: number) {
  // eslint-disable-next-line flipper/no-relative-imports-across-packages
  let {version} = require('../package.json');
  if (buildNumber) {
    // Unique build number is passed as --version parameter from Sandcastle
    version = [...version.split('.').slice(0, 2), buildNumber].join('.');
  }
  return version;
}

// Asynchronously determine current mercurial revision as string or `null` in case of any error.
export function genMercurialRevision(): Promise<string | null> {
  return spawn('hg', ['log', '-r', '.', '-T', '{node}'], {encoding: 'utf8'})
    .then(
      (res) =>
        (res &&
          (typeof res.stdout === 'string'
            ? res.stdout
            : res.stdout?.toString())) ||
        null,
    )
    .catch(() => null);
}

export async function compileServerMain(dev: boolean) {
  await fs.promises.mkdir(path.join(serverDir, 'dist'), {recursive: true});
  const out = path.join(serverDir, 'dist', 'index.js');
  console.log('⚙️  Compiling server bundle...');
  const config = Object.assign({}, await Metro.loadConfig(), {
    reporter: {update: () => {}},
    projectRoot: rootDir,
    transformer: {
      babelTransformerPath: path.join(
        babelTransformationsDir,
        'transform-server-' + (dev ? 'dev' : 'prod'),
      ),
      ...minifierConfig,
    },
    resolver: {
      // no 'mjs' / 'module'; it caused issues
      sourceExts: ['tsx', 'ts', 'js', 'json', 'cjs'],
      resolverMainFields: ['flipperBundlerEntry', 'main'],
      resolveRequest(context: any, moduleName: string, ...rest: any[]) {
        assertSaneImport(context, moduleName);
        return defaultResolve(context, moduleName, ...rest);
      },
    },
  });
  await Metro.runBuild(config, {
    platform: 'node',
    entry: path.join(serverDir, 'src', 'index.tsx'),
    out,
    dev,
    minify: false, // !dev,
    sourceMap: true,
    sourceMapUrl: dev ? 'index.map' : undefined,
    inlineSourceMap: false,
    resetCache: !dev,
  });
  console.log('✅  Compiled server bundle.');
}

// TODO: needed?
const uiSourceDirs = [
  'flipper-ui-browser',
  'flipper-ui-core',
  'flipper-plugin',
  'flipper-common',
];

export async function buildBrowserBundle(outDir: string, dev: boolean) {
  console.log('⚙️  Compiling browser bundle...');
  const out = path.join(outDir, 'bundle.js');

  const electronRequires = path.join(
    babelTransformationsDir,
    'electron-requires',
  );
  const stubModules = new Set<string>(require(electronRequires).BUILTINS);
  if (!stubModules.size) {
    throw new Error('Failed to load list of Node builtins');
  }

  const watchFolders = await dedupeFolders([
    ...(
      await Promise.all(
        uiSourceDirs.map((dir) => getWatchFolders(path.resolve(rootDir, dir))),
      )
    ).flat(),
    ...(await getPluginSourceFolders()),
  ]);

  const baseConfig = await Metro.loadConfig();
  const config = Object.assign({}, baseConfig, {
    projectRoot: browserUiDir,
    watchFolders,
    transformer: {
      ...baseConfig.transformer,
      babelTransformerPath: path.join(
        babelTransformationsDir,
        'transform-browser',
      ),
      ...(!dev ? minifierConfig : undefined),
    },
    resolver: {
      ...baseConfig.resolver,
      resolverMainFields: ['flipperBundlerEntry', 'browser', 'module', 'main'],
      blacklistRE: [/\.native\.js$/],
      sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'],
      resolveRequest(context: any, moduleName: string, ...rest: any[]) {
        assertSaneImport(context, moduleName);
        // flipper is special cased, for plugins that we bundle,
        // we want to resolve `import from 'flipper'` to 'flipper-ui-core', which
        // defines all the deprecated exports
        if (moduleName === 'flipper') {
          return MetroResolver.resolve(context, 'flipper-ui-core', ...rest);
        }
        // stubbed modules are modules that don't make sense outside a Node / Electron context,
        // like fs, child_process etc etc.
        // UI / plugins using these features should use the corresponding RenderHost api's instead
        // Ideally we'd fail hard on those, but not all plugins are properly converted yet, and some
        // libraries try to require them for feature detection (e.g. jsbase64)
        if (stubModules.has(moduleName)) {
          console.warn(
            `Found a reference to built-in module '${moduleName}', which will be stubbed out. Referer: ${context.originModulePath}`,
          );
          return {
            type: 'empty',
          };
        }
        return defaultResolve(context, moduleName, ...rest);
      },
    },
  });
  await Metro.runBuild(config, {
    platform: 'web',
    entry: path.join(browserUiDir, 'src', 'index.tsx'),
    out,
    dev,
    minify: !dev,
    sourceMap: true,
    sourceMapUrl: dev ? 'index.map' : undefined,
    inlineSourceMap: false,
  });
  console.log('✅  Compiled browser bundle.');
}

async function dedupeFolders(paths: string[]): Promise<string[]> {
  return pFilter(
    paths.filter((value, index, self) => self.indexOf(value) === index),
    (f) => fs.pathExists(f),
  );
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let proc: child.ChildProcess | undefined;

export async function launchServer(startBundler: boolean, open: boolean) {
  if (proc) {
    console.log('⚙️  Killing old flipper-server...');
    proc.kill(9);
    await sleep(1000);
  }
  console.log('⚙️  Launching flipper-server...');
  proc = child.spawn(
    'node',
    [
      '--inspect=9229',
      `../flipper-server/server.js`,
      startBundler ? `--bundler` : `--no-bundler`,
      open ? `--open` : `--no-open`,
    ],
    {
      cwd: serverDir,
      env: {
        ...process.env,
      },
      stdio: 'inherit',
    },
  );
}

function assertSaneImport(context: any, moduleName: string) {
  // This function checks that we aren't accidentally bundling up something huge we don't want to
  // bundle up
  if (
    moduleName.startsWith('jest') ||
    (moduleName.startsWith('metro') &&
      !moduleName.startsWith('metro-runtime')) ||
    moduleName === 'Metro' ||
    (moduleName.startsWith('babel') &&
      !moduleName.startsWith('babel-runtime')) ||
    moduleName.startsWith('typescript') ||
    moduleName.startsWith('electron') ||
    moduleName.startsWith('@testing-library')
  ) {
    console.error(
      `Found a reference to module '${moduleName}', which should not be imported / required. Referer: ${context.originModulePath}`,
    );
    // throwing errors doesn't really stop Metro :-/
    process.exit(1);
  }
}

function defaultResolve(...rest: any[]) {
  const [context, moduleName] = rest;
  return MetroResolver.resolve(
    {
      ...context,
      resolveRequest: null,
    },
    moduleName,
    ...rest,
  );
}
