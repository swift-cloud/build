import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { FinallyPayload } from './types'

export const client = new SQSClient({
  region: 'us-east-1'
})

export async function sendMessage(payload: FinallyPayload, body: Record<string, unknown> = {}) {
  return client.send(
    new SendMessageCommand({
      QueueUrl: payload.queueUrl,
      MessageBody: JSON.stringify(body),
      MessageGroupId: payload.messageGroupId,
      MessageDeduplicationId: payload.messageDeduplicationId
    })
  )
}
