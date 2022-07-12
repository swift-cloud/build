import { SQSHandler } from 'aws-lambda'
import { BuildMessage } from './lib/types'
import { DeploymentLogger } from './lib/cloudwatch-logs'
import * as path from 'path'
import * as git from './lib/git'
import * as s3 from './lib/s3'
import * as sqs from './lib/sqs'
import * as build from './lib/build'
import * as utils from './lib/utils'

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const payload = JSON.parse(record.body)
    await onMessage(payload)
  }
}

export async function onMessage(message: BuildMessage) {
  const logger = new DeploymentLogger(message.logs)

  // Create working directory
  const cwd = path.join(process.cwd(), `build_${message.deployment.id}`)

  try {
    // Clean working directory
    await utils.clean({ cwd })
    // Build the project
    await buildProject(message, { cwd }, logger)
  } catch (error: any) {
    logger.error(error.message ?? error.toString())
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
    // Wait for logger
    await logger.drain()
  }
}

export async function buildProject(
  payload: BuildMessage,
  options: { cwd: string },
  logger: DeploymentLogger
) {
  const startTime = Date.now()

  logger.info('[build] deployment:', payload.deployment.id)

  // Clone the repo
  logger.info('[build] git clone:', payload.git.url, payload.git.ref)
  await git.clone(payload.git, options)

  // Build the project
  const { wasmBinaryPath } = await buildWasmBinary(payload, options, logger)

  // Conditionally optimize binary
  if (payload.build.optimization) {
    logger.info('[build] swift optimize: this could take 1-2 min...')
    await build.optimize(wasmBinaryPath, options)
  }

  // Pack the project
  logger.info('[build] swift pack:', wasmBinaryPath)
  const { wasmPackagePath } = await build.pack(payload.build, wasmBinaryPath, options)

  // Upload the output
  logger.info('[build] s3 upload:', payload.output.bucket, payload.output.key)
  await s3.upload(wasmPackagePath, payload.output)

  // Send sqs message
  console.log('[build] sqs success:', payload.finally.queueUrl)
  await sqs.sendMessage(payload.finally, {
    project: payload.project,
    deployment: payload.deployment,
    output: payload.output,
    logs: payload.logs
  })

  const totalTime = (Date.now() - startTime) / 1000
  logger.info('[build] complete:', totalTime.toFixed(0) + 's', '\n')
}

async function buildWasmBinary(
  payload: BuildMessage,
  options: { cwd: string },
  logger: DeploymentLogger
): Promise<build.BuildResult> {
  switch (payload.build.language) {
    case 'swift': {
      logger.info('[build] swift build:', payload.build.configuration, payload.build.targetName)
      return build.swift(payload.build, {
        ...options,
        onStdout: (text) => logger.info('[build] swift build:', text),
        onStderr: (text) => logger.error('[build] swift build:', text)
      })
    }
    case 'nodejs': {
      logger.info('[build] node build:', payload.build.configuration, payload.build.targetName)
      return build.nodejs(payload.build, {
        ...options,
        onStdout: (text) => logger.info('[build] node build:', text),
        onStderr: (text) => logger.error('[build] node build:', text)
      })
    }
    default:
      throw new Error(`Unsupported lanugage: ${payload.build.language}`)
  }
}
