import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {BucketProps, StorageClassStrategy} from '@cdk-constructs/s3';

/**
 * Development environment configuration for S3 bucket.
 *
 * @remarks
 * This configuration creates a dev S3 bucket with:
 * - Lifecycle rules for cost optimization
 * - Versioning enabled for data protection
 * - Destroy removal policy for easy cleanup
 * - Standard storage class transitions
 */
export const S3_DEV_CONFIG: BucketProps = {
    bucketName: 'cdk-constructs-s3-example-dev-20260103',
    versioned: true,
    removalPolicy: RemovalPolicy.DESTROY,
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
};
