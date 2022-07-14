import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

// List of docker files
const dockerFiles = ['nodejs-16_x', 'nodejs-18_x', 'swift-5_5', 'swift-5_6', 'swift-5_7']

// Get current stack
export const stack = pulumi.getStack()

// Get default vpc
const vpc = awsx.ec2.Vpc.getDefault()

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
const images = dockerFiles.map((name) =>
  repo.buildAndPushImage({
    context: './',
    dockerfile: `./Dockerfile.${name}`
  })
)

// Create service
export const cluster = new awsx.ecs.Cluster('swift-build', {
  vpc,
  capacityProviders: ['FARGATE', 'FARGATE_SPOT']
})

// Create s3 write policy
const s3WritePolicy = new aws.iam.Policy('swift-build-s3-write-only', {
  description: 'Policy to put objects into the artifacts s3 bucket',
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: ['arn:aws:s3:::prod-swift-cloud-api-stac-artifactsbucket70f686f6-4negqqu8x5bo/*']
      }
    ]
  })
})

// Task role
const taskRole = new aws.iam.Role('swift-build-task-role', {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.EcsTasksPrincipal),
  managedPolicyArns: [
    s3WritePolicy.arn,
    aws.iam.ManagedPolicy.AmazonSQSFullAccess,
    aws.iam.ManagedPolicy.CloudWatchLogsFullAccess
  ]
})

// Attach sqs permissions
export const sqsRoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-sqs-attachment',
  {
    policyArn: aws.iam.ManagedPolicy.AmazonSQSFullAccess,
    role: taskRole
  }
)

// Attach s3 permissions
export const s3RoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-s3-attachment',
  {
    policyArn: s3WritePolicy.arn,
    role: taskRole
  }
)

// Attach cloudwatch permissions
export const logsRoleAttachment = new aws.iam.RolePolicyAttachment(
  'swift-build-task-role-logs-attachment',
  {
    policyArn: aws.iam.ManagedPolicy.CloudWatchLogsFullAccess,
    role: taskRole
  }
)

// Create task definition
export const taskDefinitions = images.map(
  (image, index) =>
    new awsx.ecs.FargateTaskDefinition(`swift-build-task-${dockerFiles[index]}`, {
      container: {
        image,
        cpu: 4 * 1024,
        environment: [{ name: 'SQS_QUEUE_URL', value: queues[index].url }]
      },
      taskRole
    })
)
