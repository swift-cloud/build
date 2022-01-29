import * as fs from 'fs'
import * as https from 'https'
import * as aws from 'aws-sdk'
import { OutputPayload } from './types'

const s3 = new aws.S3({
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
