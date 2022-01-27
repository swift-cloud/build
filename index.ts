import * as pulumi from '@pulumi/pulumi'
import * as awsx from '@pulumi/awsx'

// Allocate a new VPC with the default settings:
const vpc = new awsx.ec2.Vpc('swift-cloud', {})

// Create ECR repo
const repo = new awsx.ecr.Repository('swift-cloud')

// Build docker image
const image = repo.buildAndPushImage('./')

// Create container
const container = new awsx.ecs.FargateService('swift-build', {
  taskDefinitionArgs: {
    vpc,
    container: {
      image
    }
  },
  desiredCount: 1
})
