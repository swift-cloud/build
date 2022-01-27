import { spawn, SpawnOptions } from './spawn.js'

export async function clean(options: SpawnOptions) {
  await spawn('rm', ['-rf', options.cwd])
  await spawn('mkdir', [options.cwd])
}
