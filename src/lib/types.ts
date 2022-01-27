export interface MessagePayload {
  cwd: string
  cmd: string[]
  git: GitPayload
}

export interface GitPayload {
  url: string
  ref: string
  commit: string
  username: string
  password: string
}
