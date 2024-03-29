import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import * as pulumi from '@pulumi/pulumi'

// List of docker files
const dockerFiles = [
  'nodejs-16_x',
  'nodejs-18_x',
  'nodejs-20_x',
  'rust-1_x',
  'swift-5_6',
  'swift-5_7',
  'swift-5_8',
  'swift-5_9',
  'swiftwasm-5_6',
  'swiftwasm-5_7',
  'swiftwasm-5_8',
  'swiftwasm-5_9'
]

// Get current stack
export const stack = pulumi.getStack()

// Create build sqs queue
const queues = dockerFiles.map(
  (name) =>
    new aws.sqs.Queue(`build-${stack}-${name}`, {
      fifoQueue: true,
      sqsManagedSseEnabled: true,
      visibilityTimeoutSeconds: 15 * 60
    })
)

// Create ECR repo
const repo = new awsx.ecr.Repository('swift-cloud')

// Build docker image
const images = dockerFiles.map(
  (name) =>
    new awsx.ecr.Image(`image-${stack}-${name}`, {
      repositoryUrl: repo.url,
      context: './',
      dockerfile: `./src/images/Dockerfile.${name}`,
      platform: 'linux/x86_64'
    })
)

// Create service
export const cluster = new aws.ecs.Cluster('swift-build', {})

new aws.ecs.ClusterCapacityProviders('swift-build-cluster-capacity', {
  clusterName: cluster.name,
  capacityProviders: ['FARGATE', 'FARGATE_SPOT']
})

// Create s3 write policy
const s3Policy = new aws.iam.Policy('swift-build-s3-write-only', {
  description: 'Policy to put objects into the artifacts s3 bucket',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: ['arn:aws:s3:::prod-infra-api-artifactsbucket70f686f6-ahndteqyzoel/*']
      }
    ]
  }
})

// Create sqs policy
const sqsPolicy = new aws.iam.Policy('swift-build-sqs-read-delete-send', {
  description: 'Policy to read and delete messages from sqs',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        Resource: queues.map((queue) => queue.arn)
      },
      {
        Effect: 'Allow',
        Action: ['sqs:SendMessage'],
        Resource: ['arn:aws:sqs:us-east-1:172469817718:prod-infra-BuildQueue.fifo']
      }
    ]
  }
})

// Create cloudwatch logs policy
const cloudwatchLogsPolicy = new aws.iam.Policy('swift-build-cw-logs-write', {
  description: 'Policy to send logs to cloudwatch',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['logs:PutLogEvents', 'logs:DescribeLogStreams'],
        Resource: [
          'arn:aws:logs:us-east-1:172469817718:log-group:prod-infra-api-deployments66B83660-ikXKbgUtqZs9:*'
        ]
      }
    ]
  }
})

// Task role
const taskRole = new aws.iam.Role('swift-build-task-role', {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.EcsTasksPrincipal),
  managedPolicyArns: [s3Policy.arn, sqsPolicy.arn, cloudwatchLogsPolicy.arn]
})

// Attach sqs permissions
export const sqsRoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-sqs-attachment',
  {
    policyArn: sqsPolicy.arn,
    role: taskRole
  }
)

// Attach s3 permissions
export const s3RoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-s3-attachment',
  {
    policyArn: s3Policy.arn,
    role: taskRole
  }
)

// Attach cloudwatch permissions
export const logsRoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-logs-attachment',
  {
    policyArn: cloudwatchLogsPolicy.arn,
    role: taskRole
  }
)

// Create task definition
export const taskDefinitions = images.map(
  (image, index) =>
    new awsx.ecs.FargateTaskDefinition(`swift-build-task-${dockerFiles[index]}`, {
      container: {
        name: `swift-build-container-${dockerFiles[index]}`,
        image: image.imageUri,
        cpu: 4 * 1024,
        environment: [
          {
            name: 'SQS_QUEUE_URL',
            value: queues[index].url
          }
        ]
      },
      taskRole: {
        roleArn: taskRole.arn
      }
    })
)
