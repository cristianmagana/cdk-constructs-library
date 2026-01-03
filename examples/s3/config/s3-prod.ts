import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {BucketProps, StorageClassStrategy} from '@cdk-constructs/s3';

/**
 * Production environment configuration for S3 bucket.
 *
 * @remarks
 * This configuration creates a production S3 bucket with:
 * - Intelligent tiering for automatic cost optimization
 * - Versioning enabled for data protection
 * - Retain removal policy to prevent accidental deletion
 * - Archive tiers for long-term storage
 */
export const S3_PROD_CONFIG: BucketProps = {
    bucketName: 'cdk-constructs-s3-example-prod-20260103',
    versioned: true,
    removalPolicy: RemovalPolicy.RETAIN,
    storageClass: {
        strategy: StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE,
        config: {
            name: 'intelligent-tiering-archive',
            archiveAccessTierTime: Duration.days(90),
            deepArchiveAccessTierTime: Duration.days(180),
        },
    },
};
