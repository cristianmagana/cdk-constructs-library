import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {Key} from 'aws-cdk-lib/aws-kms';
import {
    Bucket,
    BlockPublicAccess,
    BucketEncryption,
    StorageClass,
    IntelligentTieringConfiguration,
    LifecycleRule,
    BucketAccessControl,
} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {BucketProps, IntelligentTieringArchiveConfig, LifecycleRuleConfig, StorageClassOverride, StorageClassStrategy} from '../types/bucket';

/**
 * Creates a default lifecycle rule with transitions to IA and Glacier.
 *
 * @internal
 */
const createDefaultLifecycleRule = (config: LifecycleRuleConfig): LifecycleRule => {
    return {
        enabled: true,
        transitions: [
            {
                storageClass: StorageClass.INFREQUENT_ACCESS,
                transitionAfter: config.infrequentAccessTransitionAfter,
            },
            {
                storageClass: StorageClass.GLACIER,
                transitionAfter: config.glacierTransitionAfter,
            },
        ],
    };
};

/**
 * Creates a lifecycle rule for intelligent tiering with immediate transition.
 *
 * @internal
 */
const createLifecycleRuleForIntelligentTiering = (): LifecycleRule => {
    return {
        enabled: true,
        transitions: [
            {
                storageClass: StorageClass.INTELLIGENT_TIERING,
                transitionAfter: Duration.days(0),
            },
        ],
    };
};

/**
 * Creates a lifecycle rule based on the storage class strategy.
 *
 * @internal
 */
const createLifecycleRule = (storageClass: StorageClassOverride): LifecycleRule => {
    switch (storageClass.strategy) {
        case StorageClassStrategy.LIFECYCLE_RULE:
            return createDefaultLifecycleRule(storageClass.config as LifecycleRuleConfig);
        case StorageClassStrategy.INTELLIGENT_TIERING_BASIC:
        case StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE:
            return createLifecycleRuleForIntelligentTiering();
        default:
            throw new Error('Invalid storage class strategy');
    }
};

/**
 * Creates an Intelligent Tiering configuration for an S3 bucket.
 *
 * @remarks
 * Storage classes enabled by default:
 * - Infrequent Access tier: 30 days
 * - Archive Instant Access tier: 90 days
 *
 * This configuration adds:
 * - Archive Access tier: configurable transition time
 * - Deep Archive Access tier: configurable transition time
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html
 *
 * @internal
 */
const createIntelligentTierConfig = (storageClass: StorageClassOverride): IntelligentTieringConfiguration => {
    return {
        name: 'intelligent-tiering-policy',
        archiveAccessTierTime: (storageClass.config as IntelligentTieringArchiveConfig).archiveAccessTierTime,
        deepArchiveAccessTierTime: (storageClass.config as IntelligentTieringArchiveConfig).deepArchiveAccessTierTime,
    };
};

/**
 * Creates an S3 bucket with configurable storage class strategies.
 *
 * @remarks
 * This function creates a secure S3 bucket with:
 * - SSL enforcement
 * - Block all public access
 * - Optional versioning
 * - Optional KMS encryption
 * - Configurable lifecycle rules and intelligent tiering
 * - Optional custom policy statements
 * - Optional CORS configuration
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns The created S3 bucket
 *
 * @example
 * ```typescript
 * import { createS3Bucket, StorageClassStrategy } from '@cdk-constructs/s3';
 * import { Duration, RemovalPolicy } from 'aws-cdk-lib';
 * import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';
 *
 * const bucket = createS3Bucket(this, {
 *   bucketName: 'my-static-content',
 *   versioned: true,
 *   storageClass: {
 *     strategy: StorageClassStrategy.LIFECYCLE_RULE,
 *     config: {
 *       infrequentAccessTransitionAfter: Duration.days(30),
 *       glacierTransitionAfter: Duration.days(90),
 *     },
 *   },
 * });
 * ```
 *
 * @see {@link BucketProps} for configuration options
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
 * @public
 */
export const createS3Bucket = (scope: Construct, props: BucketProps): Bucket => {
    const bucket = new Bucket(scope, props.bucketName, {
        bucketName: props.bucketName,
        enforceSSL: true,
        removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        accessControl: props.accessControl ?? BucketAccessControl.PRIVATE,
        encryption: props.bucketKmsEncryptionKey ? BucketEncryption.KMS : BucketEncryption.S3_MANAGED,
        encryptionKey: props.bucketKmsEncryptionKey ? Key.fromKeyArn(scope, `${props.bucketName}-kms-key`, props.bucketKmsEncryptionKey) : undefined,
        versioned: props.versioned,
        cors: props.cors ? [props.cors] : undefined,
        lifecycleRules: [createLifecycleRule(props.storageClass)],
        intelligentTieringConfigurations:
            props.storageClass.strategy === StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE ? [createIntelligentTierConfig(props.storageClass)] : undefined,
    });

    if (props.policyStatements) {
        props.policyStatements.forEach(statement => {
            bucket.addToResourcePolicy(statement);
        });
    }

    return bucket;
};
