import { BuildMessage } from '../src/lib/types'
import { onMessage } from '../src/lambda'

onMessage({
  project: {
    id: '12345'
  },
  deployment: {
    id: '12345'
  },
  git: {
    url: 'https://github.com/swift-cloud/hello-swift.git',
    ref: 'refs/heads/main',
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
    key: '12345/app.tar.gz'
  },
  finally: {
    queueUrl: ''
  }
})
