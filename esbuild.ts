import { build, BuildOptions } from 'esbuild'

const options: BuildOptions = {
  entryPoints: ['./src/fargate.ts'],
  platform: 'node',
  target: 'node14',
  minify: true,
  bundle: true,
  outfile: './bin/fargate.js'
}

build(options).catch((err) => {
  process.stderr.write(err.stderr)
  process.exit(1)
})
