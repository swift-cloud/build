import { mkdir, copyFile, writeFile } from 'fs/promises'
import { spawn, SpawnOptions } from './spawn'
import { BuildPayload } from './types'
import * as path from 'path'

export async function build(payload: BuildPayload, options: SpawnOptions) {
  // Create working directory
  const cwd = path.join(options.cwd, payload.rootDirectory ?? '.')

  // Build swift binary
  await spawn(
    'swift',
    ['build', '-c', payload.configuration, '-Xswiftc', '-Osize', '--triple', 'wasm32-unknown-wasi'],
    {
      ...options,
      cwd
    }
  )

  // Build binary path
  const wasmBinaryPath = path.join(
    cwd,
    `.build/${payload.configuration}/${payload.targetName}.wasm`
  )

  return {
    wasmBinaryPath: wasmBinaryPath
  }
}

export async function optimize(wasmBinaryPath: string, options: SpawnOptions) {
  // Optimize binary size
  await spawn('wasm-opt', ['-O2', '-o', wasmBinaryPath, wasmBinaryPath], options)
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
    wasmPackagePath: path.join(pkgDir, pkgName)
  }
}

export async function version(options: SpawnOptions) {
  return spawn('swift', ['--version'], options)
}
