import { SQSHandler } from 'aws-lambda'
import { MessagePayload } from './lib/types.js'
import { spawn } from './lib/spawn.js'
import * as utils from './lib/utils.js'

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body)
      await onMessage(payload)
    } catch (err: any) {
      console.error(err.stderr)
    }
  }
}

export async function onMessage(payload: MessagePayload) {
  // Clean working directory
  await utils.clean({ cwd: payload.cwd })
  // Run each command
  for (const cmd of payload.cmd) {
    console.log('$', cmd)
    const [command, ...args] = cmd.split(' ')
    const res = await spawn(command, args, { cwd: payload.cwd })
    if (res.stdout) {
      console.log(res.stdout)
    }
    console.log('')
  }
}
