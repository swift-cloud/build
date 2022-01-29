import { MessagePayload } from '../src/lib/types'

const payload: MessagePayload = {
  project: {
    id: '12345'
  },
  git: {
    url: 'https://github.com/swift-cloud/hello-swift.git',
    ref: 'refs/head/main',
    commit: '46e936b35d070ae094c569937093780c06723633',
    username: 'x-access-token',
    password: 'ghu_9MkL8RdatvUtLPVgjxGTisskc2cYjU1PQEVG'
  },
  build: {
    targetName: 'HelloSwift',
    configuration: 'release'
  },
  output: {
    bucket: 'pick-n-shovel',
    key: '12345/main.wasm'
  }
}

console.log(JSON.stringify(payload, null, 2))
