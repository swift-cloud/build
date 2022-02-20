import * as fs from 'fs'
import * as https from 'https'
import * as aws from 'aws-sdk'
import { FinallyPayload } from './types'

const sqs = new aws.SQS({
  region: 'us-east-1',
  httpOptions: {
    agent: new https.Agent({ keepAlive: true })
  }
})

export async function sendMessage(payload: FinallyPayload, body: Record<string, unknown> = {}) {
  await sqs
    .sendMessage({
      QueueUrl: payload.queueUrl,
      MessageBody: JSON.stringify(body),
      MessageGroupId: payload.messageGroupId,
      MessageDeduplicationId: payload.messageDeduplicationId
    })
    .promise()
}
