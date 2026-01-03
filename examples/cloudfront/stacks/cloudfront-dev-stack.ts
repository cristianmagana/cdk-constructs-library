import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createCloudFrontS3} from '@cdk-constructs/cloudfront';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying CloudFront + S3 in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the CloudFront + S3 construct with:
 * - S3 bucket for static content with lifecycle rules
 * - S3 bucket for CloudFront access logs
 * - CloudFront distribution with Origin Access Control
 * - SPA-friendly error responses (404/403 -> index.html)
 * - Cost-optimized price class
 *
 * For custom domain setup:
 * 1. Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`
 * 2. Add your certificate ARN, domain names, and Route 53 configuration
 * 3. Deploy! The construct will create Route 53 A-record automatically.
 */
export class CloudFrontDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Resolve configuration with local overrides (if environments.local.ts exists)
        const config = ConfigResolver.getCloudFrontDevConfig();

        const {distribution, contentBucket, logBucket} = createCloudFrontS3(this, {
            ...config,
        });

        // Output the CloudFront distribution details
        new CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront distribution ID',
        });

        new CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront distribution domain name',
        });

        new CfnOutput(this, 'ContentBucketName', {
            value: contentBucket.bucketName,
            description: 'S3 bucket name for static content',
        });

        new CfnOutput(this, 'LogBucketName', {
            value: logBucket.bucketName,
            description: 'S3 bucket name for CloudFront logs',
        });
    }
}
