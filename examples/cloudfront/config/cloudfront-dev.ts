import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {CloudFrontS3Props, StorageClassStrategy} from '@cdk-constructs/cloudfront';

/**
 * Development environment configuration for CloudFront + S3.
 *
 * @remarks
 * This configuration creates a dev CloudFront distribution with:
 * - S3 bucket for static content
 * - S3 bucket for CloudFront access logs
 * - Default error responses for SPA applications
 * - Cost-optimized price class (US, Canada, Europe)
 * - Destroy removal policy for easy cleanup
 *
 * Replace the domain and certificate values if you want to test with a custom domain.
 */
export const CLOUDFRONT_DEV_CONFIG: CloudFrontS3Props = {
    s3: {
        bucketName: 'cdk-constructs-cloudfront-content-dev-20260103',
        versioned: true,
        removalPolicy: RemovalPolicy.DESTROY,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    },
    cloudfront: {
        distributionName: 'cdk-constructs-cf-dev',
        logBucketName: 'cdk-constructs-cloudfront-logs-dev-20260103',
        defaultRootObject: 'index.html',
        comment: 'Development CloudFront distribution for CDK constructs example',
        // Uncomment to use a custom domain (requires ACM certificate in us-east-1)
        // domainNames: ['dev.example.com'],
        // certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id',
    },
    route53: {
        enableR53Lookup: false,
        // Uncomment to create Route 53 A-record
        // hostedZoneId: 'Z1234567890ABC',
        // domainName: 'example.com',
        // aRecordAddress: 'dev.example.com',
    },
};
