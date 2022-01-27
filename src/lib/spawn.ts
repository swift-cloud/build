import { spawn as _spawn, SpawnOptions as _SpawnOptions } from 'child_process'

export type SpawnOptions = _SpawnOptions & { cwd: string }

export interface SpawnResult {
  code: number | null
  stdout: string | null
  stderr: string | null
}

export async function spawn(
  command: string,
  args: string[],
  options: SpawnOptions = { cwd: './' }
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const process = _spawn(command, args, options)
    process.stdout?.on('data', (data) => (stdout += data.toString('utf8')))
    process.stderr?.on('data', (data) => (stderr += data.toString('utf8')))
    process.on('close', (code) => {
      const result = {
        code,
        stdout: stdout || null,
        stderr: stderr || null
      }
      if (typeof code === 'number' && code > 0) {
        reject(result)
      } else {
        resolve(result)
      }
    })
  })
}
