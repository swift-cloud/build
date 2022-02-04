import { mkdir, copyFile, writeFile } from 'fs/promises'
import { spawn, SpawnOptions } from './spawn'
import { BuildPayload } from './types'

export async function build(payload: BuildPayload, options: SpawnOptions) {
  // Build swift binary
  await spawn(
    'swift',
    ['build', '-c', payload.configuration, '--triple', 'wasm32-unknown-wasi'],
    options
  )

  // Build binary path
  const localWasmPath = `.build/${payload.configuration}/${payload.targetName}.wasm`

  // Optimize binary size
  await spawn('wasm-opt', ['-O2', '-o', localWasmPath, localWasmPath], options)

  return {
    wasmBinaryPath: `${options.cwd}/${localWasmPath}`
  }
}

export async function pack(wasmBinaryPath: string, options: SpawnOptions) {
  const pkgDir = `${options.cwd}/pkg`
  const appDir = `${pkgDir}/app`
  const binDir = `${appDir}/bin`
  const pkgName = `app.tar.gz`

  // Make necessary directories
  await mkdir(pkgDir)
  await mkdir(appDir)
  await mkdir(binDir)

  // Copy WASM binary to pkg dir
  await copyFile(wasmBinaryPath, `${binDir}/main.wasm`)

  // Write fastly.toml necessary for deploy
  await writeFile(
    `${appDir}/fastly.toml`,
    ['language = "swift"', 'manifest_version = 2', 'name = "app"'].join('\n')
  )

  // Zip up binary
  await spawn('tar', ['-czvf', `../${pkgName}`, '.'], {
    cwd: appDir
  })

  return {
    wasmPackagePath: `${pkgDir}/${pkgName}`
  }
}

export async function version(options: SpawnOptions) {
  return spawn('swift', ['--version'], options)
}
