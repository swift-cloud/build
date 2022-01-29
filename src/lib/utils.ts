import { spawn, SpawnOptions } from './spawn'

export async function remove(options: SpawnOptions) {
  await spawn('rm', ['-rf', options.cwd])
}

export async function clean(options: SpawnOptions) {
  await remove(options)
  await spawn('mkdir', [options.cwd])
}
