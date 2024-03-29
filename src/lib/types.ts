export interface BuildMessage {
  project: ProjectPayload
  deployment: DeploymentPayload
  git: GitPayload
  build: BuildPayload
  output: OutputPayload
  logs: LogsPayload
  finally: FinallyPayload
}

export interface ProjectPayload {
  id: string
}

export interface DeploymentPayload {
  id: string
}

export interface GitPayload {
  url: string
  ref: string
  commit: string
  username: string
  password: string
}

export interface BuildPayload {
  language: 'swift' | 'nodejs' | 'rust' | 'go'
  languageVersion: string
  targetName: string
  configuration: 'debug' | 'release'
  optimization: boolean
  rootDirectory?: string
}

export interface OutputPayload {
  bucket: string
  key: string
}

export interface LogsPayload {
  group: string
  stream: string
}

export interface FinallyPayload {
  queueUrl: string
  messageGroupId?: string
  messageDeduplicationId?: string
}
