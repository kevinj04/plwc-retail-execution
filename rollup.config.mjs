import path from 'node:path';
import lwc from '@lwc/rollup-plugin';

const rootDir = process.cwd();
const appDir = path.resolve(rootDir, 'pulsar-app');
const lwcDir = path.resolve(rootDir, 'force-app/main/default/lwc');

function resolveCModules() {
  return {
    name: 'resolve-c-modules',
    resolveId(source) {
      if (!source.startsWith('c/')) {
        return null;
      }

      const componentName = source.slice(2);
      return path.resolve(lwcDir, componentName, `${componentName}.js`);
    }
  };
}

export default {
  input: path.resolve(appDir, 'src/main.js'),
  output: {
    file: path.resolve(rootDir, 'dist/pulsar-app/main.js'),
    format: 'esm',
    sourcemap: true,
    intro: `const process = {
  env: {
    NODE_ENV: 'production',
    FORCE_NATIVE_SHADOW_MODE_FOR_TEST: false,
    SKIP_LWC_VERSION_MISMATCH_CHECK: false
  }
};`
  },
  plugins: [
    resolveCModules(),
    lwc({
      rootDir,
      modules: [{ dir: lwcDir }],
      enableStaticContentOptimization: false
    })
  ]
};
