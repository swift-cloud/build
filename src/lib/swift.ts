import { mkdir, copyFile, writeFile } from 'fs/promises'
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

export async function pack(wasmBinaryPath: string, options: SpawnOptions) {
  const pkgDir = `${options.cwd}/pkg`
  const tarPath = `${pkgDir}/app.tar.gz`
  await mkdir(pkgDir)
  await mkdir(`${pkgDir}/app`)
  await mkdir(`${pkgDir}/app/bin`)
  await copyFile(wasmBinaryPath, `${pkgDir}/app/bin/main.wasm`)
  await writeFile(
    `${pkgDir}/app/fastly.toml`,
    ['language = "swift"', 'manifest_version = 2', 'name = "app"'].join('\n')
  )
  await spawn('tar', ['-czvf', '../app.tar.gz', '.'], {
    cwd: `${pkgDir}/app`
  })
  return {
    wasmPackagePath: tarPath
  }
}

export async function version(options: SpawnOptions) {
  return spawn('swift', ['--version'], options)
}
