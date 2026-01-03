import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {BucketAccessControl, CorsRule} from 'aws-cdk-lib/aws-s3';

/**
 * Properties for creating an S3 bucket.
 *
 * @public
 */
export type BucketProps = {
    /** S3 bucket name - used as construct ID and for bucket naming */
    bucketName: string;

    /** Enable versioning for the bucket */
    versioned: boolean;

    /** Storage class configuration for the bucket */
    storageClass: StorageClassOverride;

    /** Optional policy statements to attach to the bucket */
    policyStatements?: PolicyStatement[];

    /** Optional CORS configuration */
    cors?: CorsRule;

    /** Optional KMS encryption key ARN */
    bucketKmsEncryptionKey?: string;

    /** Optional access control setting */
    accessControl?: BucketAccessControl;

    /** Optional removal policy */
    removalPolicy?: RemovalPolicy;
};

/**
 * Configuration for lifecycle rules with transitions.
 *
 * @public
 */
export type LifecycleRuleConfig = {
    /** Duration before transitioning to Infrequent Access storage class */
    infrequentAccessTransitionAfter: Duration;

    /** Duration before transitioning to Glacier storage class */
    glacierTransitionAfter: Duration;
};

/**
 * Storage class strategy options for S3 buckets.
 *
 * @remarks
 * - LIFECYCLE_RULE: Manual lifecycle transitions to IA and Glacier
 * - INTELLIGENT_TIERING_BASIC: Basic intelligent tiering (IA and Archive Instant Access)
 * - INTELLIGENT_TIERING_ARCHIVE: Intelligent tiering with Archive and Deep Archive tiers
 *
 * @public
 */
export enum StorageClassStrategy {
    LIFECYCLE_RULE,
    INTELLIGENT_TIERING_BASIC,
    INTELLIGENT_TIERING_ARCHIVE,
}

/**
 * Configuration for basic intelligent tiering.
 *
 * @remarks
 * Storage classes enabled by default:
 * - Infrequent Access tier: 30 days
 * - Archive Instant Access tier: 90 days
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html
 *
 * @public
 */
export type IntelligentTieringBasicConfig = {
    /** Name for the intelligent tiering configuration */
    name: string;
};

/**
 * Configuration for intelligent tiering with archive tiers.
 *
 * @remarks
 * Extends basic intelligent tiering with:
 * - Archive Access tier: configurable transition time
 * - Deep Archive Access tier: configurable transition time
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html
 *
 * @public
 */
export type IntelligentTieringArchiveConfig = {
    /** Name for the intelligent tiering configuration */
    name: string;

    /** Duration before transitioning to Archive Access tier */
    archiveAccessTierTime: Duration;

    /** Duration before transitioning to Deep Archive Access tier */
    deepArchiveAccessTierTime: Duration;
};

/**
 * Storage class override configuration for S3 buckets.
 *
 * @remarks
 * Allows selection of different storage class strategies with their respective configurations.
 *
 * @public
 */
export type StorageClassOverride = {
    /** Storage class strategy to use */
    strategy: StorageClassStrategy;

    /** Configuration for the selected strategy */
    config: LifecycleRuleConfig | IntelligentTieringBasicConfig | IntelligentTieringArchiveConfig;
};
