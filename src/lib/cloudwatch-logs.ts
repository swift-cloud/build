import * as https from 'https'
import * as aws from 'aws-sdk'

export const cloudwatchLogs = new aws.CloudWatchLogs({
  region: 'us-east-1',
  httpOptions: {
    agent: new https.Agent({ keepAlive: true })
  }
})

export const logGroups = {
  deployments: '/swift-cloud/deployments'
}

export async function createDeploymentLogStream(id: string) {
  return cloudwatchLogs
    .createLogStream({
      logGroupName: logGroups.deployments,
      logStreamName: id
    })
    .promise()
}

export interface LogEvent {
  timestamp: number
  message: string
}

export async function queryDeploymentLogs(id: string, props?: { nextToken?: string }) {
  const res = await cloudwatchLogs
    .getLogEvents({
      logGroupName: logGroups.deployments,
      logStreamName: id,
      startFromHead: true,
      nextToken: props?.nextToken
    })
    .promise()
  return {
    events: res.events ?? [],
    nextToken: res.nextForwardToken
  }
}

export async function writeDeploymentLogs(
  id: string,
  events: LogEvent[],
  props?: { sequenceToken?: string }
) {
  const sequenceToken = await (props?.sequenceToken
    ? props.sequenceToken
    : cloudwatchLogs
        .describeLogStreams({
          logGroupName: logGroups.deployments,
          logStreamNamePrefix: id
        })
        .promise()
        .then((res) => res.logStreams?.[0].uploadSequenceToken))

  return await cloudwatchLogs
    .putLogEvents({
      logGroupName: logGroups.deployments,
      logStreamName: id,
      logEvents: events,
      sequenceToken: sequenceToken
    })
    .promise()
}

export class DeploymentLogger {
  readonly id: string
  private sequenceToken?: string

  constructor(id: string) {
    this.id = id
  }

  async write(event: string | LogEvent | LogEvent[]) {
    const events: LogEvent[] =
      typeof event === 'string'
        ? [{ timestamp: Date.now(), message: event }]
        : Array.isArray(event)
        ? event
        : [event]
    const res = await writeDeploymentLogs(this.id, events, {
      sequenceToken: this.sequenceToken
    })
    this.sequenceToken = res.nextSequenceToken
  }
}
