import * as fs from 'fs'
import * as https from 'https'
import S3 from 'aws-sdk/clients/s3'
import { OutputPayload } from './types'

export const s3 = new S3({
  region: 'us-east-1',
  httpOptions: {
    agent: new https.Agent({ keepAlive: true })
  }
})

export async function upload(localPath: string, payload: OutputPayload) {
  const readStream = fs.createReadStream(localPath)
  await s3
    .upload({
      Bucket: payload.bucket,
      Key: payload.key,
      Body: readStream
    })
    .promise()
}
