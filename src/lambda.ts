import { SQSHandler } from 'aws-lambda'
import { BuildMessage } from './lib/types'
import * as git from './lib/git'
import * as s3 from './lib/s3'
import * as sqs from './lib/sqs'
import * as swift from './lib/swift'
import * as utils from './lib/utils'

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const payload = JSON.parse(record.body)
    await onMessage(payload)
  }
}

export async function onMessage(message: BuildMessage) {
  // Create working directory
  const cwd = `./build_${message.deployment.id}`

  try {
    // Clean working directory
    await utils.clean({ cwd })
    // Build the project
    await build(message, { cwd })
  } catch (error: any) {
    console.error('[build] error:')
    console.error(error)
    // Send error message
    await sqs.sendMessage(message.finally, {
      project: message.project,
      deployment: message.deployment,
      output: message.output,
      error: {
        code: Number(error.code ?? -1),
        message: error.stderr ?? error.message,
        stack: error.stack ?? null
      }
    })
  } finally {
    // Clean up when complete
    await utils.remove({ cwd })
  }
}

export async function build(payload: BuildMessage, options: { cwd: string }) {
  const startTime = Date.now()

  console.log('[build] deployment:', payload.deployment.id)

  // Clone the repo
  console.log('[build] git clone:', payload.git.url, payload.git.ref)
  await git.clone(payload.git, options)

  // Build the project
  console.log('[build] swift build:', payload.build.configuration, payload.build.targetName)
  const { wasmBinaryPath } = await swift.build(payload.build, options)

  // Pack the project
  console.log('[build] swift pack:', wasmBinaryPath)
  const { wasmPackagePath } = await swift.pack(wasmBinaryPath, options)

  // Upload the output
  console.log('[build] s3 upload:', payload.output.bucket, payload.output.key)
  await s3.upload(wasmPackagePath, payload.output)

  // Send sqs message
  console.log('[build] sqs success:', payload.finally.queueUrl)
  await sqs.sendMessage(payload.finally, {
    project: payload.project,
    deployment: payload.deployment,
    output: payload.output
  })

  const totalTime = (Date.now() - startTime) / 1000
  console.log('[build] complete:', totalTime.toFixed(0) + 's', '\n')
}
