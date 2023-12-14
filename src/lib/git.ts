import { SpawnOptions, spawn } from './spawn'
import { GitPayload } from './types'

export async function clone(payload: GitPayload, options: SpawnOptions) {
  // Build url with auth
  const url = new URL(payload.url)
  url.username = payload.username
  url.password = payload.password

  // Create repo
  await init(options)

  // Add origin
  await addOrigin(url, options)

  // Fetch ref
  await fetch(payload.commit, options)

  // Checkout
  await checkout('FETCH_HEAD', options)
}

export async function init(options: SpawnOptions) {
  return spawn('git', ['init'], options)
}

export async function addOrigin(url: URL, options: SpawnOptions) {
  return spawn('git', ['remote', 'add', 'origin', url.href], options)
}

export async function fetch(commit: string, options: SpawnOptions) {
  return spawn('git', ['fetch', '--depth', '1', 'origin', commit], options)
}

export async function checkout(ref: string, options: SpawnOptions) {
  return spawn('git', ['checkout', ref], options)
}
