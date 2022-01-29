import { SQSHandler } from 'aws-lambda'
import { MessagePayload } from './lib/types'
import * as git from './lib/git'
import * as s3 from './lib/s3'
import * as swift from './lib/swift'
import * as utils from './lib/utils'

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
  // Slugify git ref
  const slug = payload.git.ref.replace(/\//g, '-')

  // Create directory combining project id and ref slug
  const cwd = `./${payload.project.id}-${slug}`

  try {
    // Clean working directory
    await utils.clean({ cwd })
    // Build the project
    await build(payload, cwd)
  } finally {
    // Clean up when complete
    await utils.remove({ cwd })
  }
}

export async function build(payload: MessagePayload, cwd: string) {
  const startTime = Date.now()

  console.log('[build] project:', payload.project.id)

  // Clone the repo
  console.log('[build] git clone:', payload.git.url, payload.git.ref)
  await git.clone(payload.git, { cwd })

  // Build the project
  console.log('[build] swift build:', payload.build.configuration, payload.build.targetName)
  const { wasmBinaryPath } = await swift.build(payload.build, { cwd })

  // Upload the output
  console.log('[build] s3 upload:', payload.output.bucket, payload.output.key)
  await s3.upload(wasmBinaryPath, payload.output)

  const totalTime = (Date.now() - startTime) / 1000
  console.log('[build] complete:', totalTime.toFixed(0) + 's', '\n')
}
