export interface MessagePayload {
  project: ProjectPayload
  git: GitPayload
  build: BuildPayload
  output: OutputPayload
}

export interface ProjectPayload {
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
  targetName: string
  configuration: 'debug' | 'release'
}

export interface OutputPayload {
  bucket: string
  key: string
}
