import { spawn as _spawn, SpawnOptions as _SpawnOptions } from 'child_process'

export type SpawnOptions = _SpawnOptions & {
  cwd: string
  onStdout?: (data: string) => any
  onStderr?: (data: string) => any
}

export interface SpawnResult {
  code: number | null
  stdout: string | null
  stderr: string | null
}

export async function spawn(
  command: string,
  args: string[],
  { onStdout, onStderr, ...options }: SpawnOptions = { cwd: './' }
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const cmd = _spawn(command, args, {
      ...options,
      env: {
        HOME: process.env.HOME,
        PATH: process.env.PATH,
        PWD: process.env.PWD,
        LANG: process.env.LANG,
        USER: process.env.USER
      }
    })
    cmd.stdout?.on('data', (data) => {
      const chunk = data.toString('utf8')
      onStdout?.(chunk)
      stdout += chunk
    })
    cmd.stderr?.on('data', (data) => {
      const chunk = data.toString('utf8')
      onStderr?.(chunk)
      stderr += chunk
    })
    cmd.on('close', (code) => {
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
    cmd.on('error', reject)
  })
}
