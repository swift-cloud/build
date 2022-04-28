import * as https from 'https'
import SQS from 'aws-sdk/clients/sqs'
import { FinallyPayload } from './types'

export const sqs = new SQS({
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
