import { build } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';

Promise.all([
  build({
    entryPoints: ['src/index.ts'],
    format: 'cjs',
    bundle: true,
    platform: 'node',
    outfile: 'dist/index.cjs',
    target: 'node18',
    plugins:[
      replace({
        'import.meta.url': '\`file:///${__filename}\`'
      })
    ]
  }),
  build({
    entryPoints: ['src/index.ts'],
    format: 'esm',
    bundle: true,
    platform: 'node',
    outfile: 'dist/index.js',
    target: 'node18'
  })
]).catch(() => process.exit(1))