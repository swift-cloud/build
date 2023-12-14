import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  PutLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs'
import * as fastq from 'fastq'

export const client = new CloudWatchLogsClient({
  region: 'us-east-1'
})

export interface LogEvent {
  timestamp: number
  message: string
}

export async function writeDeploymentLogs(
  events: LogEvent[],
  props: { group: string; stream: string; sequenceToken?: string }
) {
  const sequenceToken = await (props?.sequenceToken
    ? props.sequenceToken
    : client
        .send(
          new DescribeLogStreamsCommand({
            logGroupName: props.group,
            logStreamNamePrefix: props.stream
          })
        )
        .then((res) => res.logStreams?.[0].uploadSequenceToken))

  return await client.send(
    new PutLogEventsCommand({
      logGroupName: props.group,
      logStreamName: props.stream,
      logEvents: events,
      sequenceToken: sequenceToken
    })
  )
}

export interface DeploymentLog {
  type: 'info' | 'warning' | 'error'
  text: string
}

export class DeploymentLogger {
  readonly group: string
  readonly stream: string
  private q: fastq.queueAsPromised<LogEvent[]>
  private sequenceToken?: string

  constructor(props: { group: string; stream: string }) {
    this.group = props.group
    this.stream = props.stream
    this.q = fastq.promise((task) => this._write(task), 1)
  }

  private async _write(events: LogEvent[]) {
    const res = await writeDeploymentLogs(events, {
      group: this.group,
      stream: this.stream,
      sequenceToken: this.sequenceToken
    })
    this.sequenceToken = res.nextSequenceToken
  }

  async drain() {
    if (this.q.idle()) {
      return
    }
    return this.q.drained()
  }

  write(event: DeploymentLog | DeploymentLog[]) {
    const logs: DeploymentLog[] = Array.isArray(event) ? event : [event]
    const events = logs.map((log) => ({ timestamp: Date.now(), message: JSON.stringify(log) }))
    return this.q.push(events)
  }

  info(...text: string[]) {
    console.log(...text)
    return this.write({ type: 'info', text: text.join(' ') })
  }

  warn(...text: string[]) {
    console.warn(...text)
    return this.write({ type: 'warning', text: text.join(' ') })
  }

  error(...text: string[]) {
    console.error(...text)
    return this.write({ type: 'error', text: text.join(' ') })
  }
}
