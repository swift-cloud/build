import { spawn, SpawnOptions } from './spawn'
import { BuildPayload } from './types'

export async function build(payload: BuildPayload, options: SpawnOptions) {
  await spawn(
    'swift',
    ['build', '-c', payload.configuration, '--triple', 'wasm32-unknown-wasi'],
    options
  )

  return {
    wasmBinaryPath: `${options.cwd}/.build/${payload.configuration}/${payload.targetName}.wasm`
  }
}

export async function version(options: SpawnOptions) {
  return spawn('swift', ['--version'], options)
}
