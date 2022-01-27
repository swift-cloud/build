import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

// Create ECR repo
const repo = new awsx.ecr.Repository('swift-cloud')

// Build docker image
const image = repo.buildAndPushImage('./')

// Create container
const container = new awsx.ecs.FargateService('swift-build', {
  taskDefinitionArgs: {
    container: {
      image
    }
  },
  desiredCount: 1
})
