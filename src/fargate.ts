import { Consumer } from 'sqs-consumer'
import { Message } from '@aws-sdk/client-sqs'
import * as lambda from './lambda'

console.log('Listening to queue:', process.env.SQS_QUEUE_URL)

// Check for a long lived process
const taskKeepAlive = process.env.TASK_KEEP_ALIVE === 'true'

// Time to wait for an initial task
const initialExitTimeout = 20 * 1000

// Time to wait for a new task _after_ completing a prior task
const taskExitTimeout = 5 * 60 * 1000

let isProcessingMessage = false

let shouldExitImmediately = false

let exitAfterTimeoutHandle: any = null

async function handleMessage(message: Message) {
  try {
    // Mark message processing
    isProcessingMessage = true

    // Parse message payload
    const payload = JSON.parse(message.Body ?? '')

    // Execute message payload using lambda style handler
    await lambda.onMessage(payload)
  } catch (err: any) {
    // Catch and log any error
    console.error(err.stderr ?? err.message)
  } finally {
    // Mark message complete
    isProcessingMessage = false

    // Check if we received sigterm and should exit
    if (shouldExitImmediately) {
      process.exit(0)
    }

    // Set timeout triffer
    exitAfterTimeout(taskExitTimeout)
  }
}

// Exit task 20 seconds after start up if we dont receive a task
exitAfterTimeout(initialExitTimeout)

// Listen for messages on sqs queue
const app = Consumer.create({
  queueUrl: process.env.SQS_QUEUE_URL!,
  batchSize: 1,
  handleMessage
})

// Handle app errors
app.on('error', (err: any) => {
  console.error(err.message)
})

// Handle processing errors
app.on('processing_error', (err: any) => {
  console.error(err.message)
})

// Start listening for messages
app.start()

// Handle Fargate sigterm and exit as soon as we can
process.on('SIGTERM', () => {
  // Mark should exit
  shouldExitImmediately = true

  // Stop listening for messages
  app.stop()

  // If we're processing a messgae then we must wait
  if (isProcessingMessage) {
    return
  }

  // Otherwise exit immediately
  process.exit(0)
})

function exitAfterTimeout(ms: number) {
  if (taskKeepAlive) {
    return
  }

  clearTimeout(exitAfterTimeoutHandle)

  exitAfterTimeoutHandle = setTimeout(() => {
    if (isProcessingMessage) {
      return
    }
    process.exit(0)
  }, ms)
}
