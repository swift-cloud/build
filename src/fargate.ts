import { Consumer } from 'sqs-consumer'
import * as https from 'https'
import * as aws from 'aws-sdk'
import * as lambda from './lambda'

console.log('Listening to queue:', process.env.SQS_QUEUE_URL)

const app = Consumer.create({
  queueUrl: process.env.SQS_QUEUE_URL,
  batchSize: 1,
  handleMessage: async (message) => {
    try {
      const payload = JSON.parse(message.Body ?? '')
      await lambda.onMessage(payload)
    } catch (err: any) {
      console.error(err.stderr ?? err.message)
    }
    app.stop()
    process.exit()
  },
  sqs: new aws.SQS({
    region: 'us-east-1',
    httpOptions: {
      agent: new https.Agent({ keepAlive: true })
    }
  })
})

app.on('error', (err: any) => {
  console.error(err.message)
})

app.on('processing_error', (err: any) => {
  console.error(err.message)
})

app.start()
