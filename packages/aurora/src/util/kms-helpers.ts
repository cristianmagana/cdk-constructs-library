import {Construct} from 'constructs';
import {Key} from 'aws-cdk-lib/aws-kms';
import {RemovalPolicy, Duration} from 'aws-cdk-lib';
import {PolicyDocument, PolicyStatement, AccountRootPrincipal} from 'aws-cdk-lib/aws-iam';

/**
 * Configuration for creating a customer-managed KMS key.
 *
 * @public
 */
export type KmsKeyConfig = {
    /** Cluster name for naming the key. */
    clusterName: string;

    /** Description for the key. @defaultValue `KMS key for {clusterName} Aurora cluster` */
    description?: string;

    /** Removal policy for the key. @defaultValue `RemovalPolicy.RETAIN` */
    removalPolicy?: RemovalPolicy;

    /** Pending window for key deletion in days. @defaultValue `30 days` */
    pendingWindowDays?: number;

    /** Whether to enable automatic key rotation. @defaultValue `true` */
    enableKeyRotation?: boolean;
};

/**
 * Creates a customer-managed KMS key for Aurora cluster encryption.
 *
 * @remarks
 * Creates a KMS key with:
 * - Automatic key rotation enabled
 * - Account root principal access
 * - Retention policy (default: RETAIN for safety)
 * - 30-day pending deletion window (default)
 *
 * @param scope - The construct scope
 * @param id - Unique identifier for this construct
 * @param config - KMS key configuration
 * @returns The created KMS key
 *
 * @example
 * ```typescript
 * const kmsKey = createAuroraKmsKey(this, 'DatabaseKey', {
 *   clusterName: 'my-cluster',
 *   removalPolicy: RemovalPolicy.DESTROY, // For dev/test only
 * });
 *
 * const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
 *   // ... other config
 *   storageEncryptionKey: kmsKey,
 * });
 * ```
 *
 * @see {@link KmsKeyConfig} for configuration options
 * @public
 */
export const createAuroraKmsKey = (scope: Construct, id: string, config: KmsKeyConfig): Key => {
    return new Key(scope, id, {
        alias: `alias/${config.clusterName}-aurora-key`,
        description: config.description || `KMS key for ${config.clusterName} Aurora cluster`,
        enableKeyRotation: config.enableKeyRotation !== undefined ? config.enableKeyRotation : true,
        removalPolicy: config.removalPolicy || RemovalPolicy.RETAIN,
        pendingWindow: Duration.days(config.pendingWindowDays || 30),
        policy: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    sid: 'Enable IAM User Permissions',
                    actions: ['kms:*'],
                    principals: [new AccountRootPrincipal()],
                    resources: ['*'],
                }),
            ],
        }),
    });
};
