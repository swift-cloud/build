import { createReadStream } from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { OutputPayload } from './types'

export const client = new S3Client({
  region: 'us-east-1'
})

export async function upload(localPath: string, payload: OutputPayload) {
  const readStream = createReadStream(localPath)
  return client.send(
    new PutObjectCommand({
      Bucket: payload.bucket,
      Key: payload.key,
      Body: readStream
    })
  )
}
