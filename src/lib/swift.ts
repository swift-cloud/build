import { spawn, SpawnOptions } from './spawn.js'

export async function build(options: SpawnOptions) {
  return spawn(
    'swift',
    [
      'build',
      '-Xswiftc',
      '-module-cache-path',
      '-Xswiftc',
      `${options.cwd}/.cache`,
      '-c',
      'release',
      '--triple',
      'wasm32-unknown-wasi'
    ],
    options
  )
}

export async function version(options: SpawnOptions) {
  return spawn('swift', ['--version'], options)
}
