import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

// Allocate a new VPC with the default settings:
const vpc = new awsx.ec2.Vpc('swift-cloud', {
  subnets: [{ type: 'public' }],
  numberOfAvailabilityZones: 1
})

// Create ECR repo
const repo = new awsx.ecr.Repository('swift-cloud')

// Build docker image
const image = repo.buildAndPushImage({
  context: './',
  dockerfile: './Dockerfile',
  cacheFrom: {
    stages: ['base', 'aws']
  }
})

// Create service
const cluster = new awsx.ecs.Cluster('swift-build', {
  vpc
})

// Task role
const taskRole = new aws.iam.Role('swift-build-task-role', {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.SqsPrincipal)
})

// Attach sqs permissions
new aws.iam.RolePolicyAttachment('rpa-ssmrole-ec2containerservice', {
  policyArn: aws.iam.ManagedPolicy.AmazonSQSFullAccess,
  role: taskRole
})

// Create container
const service = new awsx.ecs.FargateService('swift-build-service', {
  cluster,
  taskDefinitionArgs: {
    container: {
      image,
      essential: true
    },
    taskRole
  },
  desiredCount: 1
})
