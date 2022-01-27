import * as pulumi from '@pulumi/pulumi'
import * as awsx from '@pulumi/awsx'

// Allocate a new VPC with the default settings:
const vpc = new awsx.ec2.Vpc('swift-cloud', {})

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

// Create container
const service = new awsx.ecs.FargateService('swift-build-service', {
  cluster,
  taskDefinitionArgs: {
    container: {
      image
    }
  },
  desiredCount: 1
})
