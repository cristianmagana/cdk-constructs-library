import {IClusterEngine, DatabaseCluster, DatabaseClusterFromSnapshot, DatabaseInsightsMode, SnapshotCredentials} from 'aws-cdk-lib/aws-rds';
import {InstanceType} from 'aws-cdk-lib/aws-ec2';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {IRole} from 'aws-cdk-lib/aws-iam';
import {IBucket} from 'aws-cdk-lib/aws-s3';
import {IKey} from 'aws-cdk-lib/aws-kms';
import {ISecret} from 'aws-cdk-lib/aws-secretsmanager';

/**
 * Configuration for Aurora cluster parameter groups.
 *
 * @remarks
 * If name is not provided, it will be auto-generated as:
 * `{clusterName}-{type}-{engineFamily}-{majorVersion}-{minorVersion}`
 *
 * @example
 * ```typescript
 * const config: ParameterGroupConfig = {
 *   description: 'Custom parameter group',
 *   parameters: {
 *     'max_connections': '1000',
 *   },
 * };
 * // Auto-generated name: "my-cluster-cluster-aurora-mysql-3-09"
 * ```
 *
 * @public
 */
export type ParameterGroupConfig = {
    /**
     * Custom name for the parameter group.
     * @remarks
     * If not provided, will be auto-generated based on cluster name and engine version.
     * @defaultValue Auto-generated from cluster name and engine version
     */
    name?: string;

    /**
     * The engine to use for the parameter group.
     * @remarks
     * If not provided, will use the cluster engine.
     * @defaultValue Cluster engine
     */
    engine?: IClusterEngine;

    /**
     * Description for the parameter group.
     * @defaultValue Auto-generated description
     */
    description?: string;

    /** The parameters to apply to the parameter group. @defaultValue `{}` */
    parameters?: {
        [key: string]: string;
    };
};

/**
 * Configuration for Aurora cluster reader instances.
 *
 * @example
 * ```typescript
 * const config: ReaderConfig = {
 *   readerInstanceCount: 2,
 *   instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
 * };
 * ```
 *
 * @public
 */
export type ReaderConfig = {
    /** Number of reader instances to create. @defaultValue `0` */
    readerInstanceCount?: number;

    /** Instance type for reader instances. */
    instanceType?: InstanceType;
};

/**
 * Base configuration for Aurora database clusters.
 *
 * @remarks
 * This type provides common configuration options for both MySQL and PostgreSQL Aurora clusters.
 * Users have full control over engine versions and are not forced to upgrade.
 *
 * @see {@link AuroraMySqlClusterProps} for MySQL-specific configuration
 * @see {@link AuroraPostgresClusterProps} for PostgreSQL-specific configuration
 * @public
 */
export type AuroraClusterBaseConfig = {
    /** The engine to use for the cluster. Users must specify their desired version. */
    engine: IClusterEngine;

    /** The name for the cluster. Must be unique within the account and region. */
    clusterName: string;

    /** The VPC ID where the cluster will be deployed. */
    vpcId: string;

    /** The database writer instance type. @defaultValue `InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE)` */
    writerInstanceType: InstanceType;

    /**
     * Subnet IDs to deploy the cluster in.
     * @remarks
     * These subnet IDs will be used to select specific private subnets from the VPC.
     * The subnet IDs are converted to a SubnetSelection using the selectSubnetsByIds utility.
     */
    subnetIds: string[];

    /** The name of the database to create. */
    databaseName: string;

    /** Cluster reader configuration. @defaultValue No readers */
    readersConfig?: ReaderConfig;

    /** Cluster parameter group configuration. */
    clusterParameters: ParameterGroupConfig;

    /** Instance parameter group configuration. */
    instanceParameters: ParameterGroupConfig;

    /**
     * CloudWatch log groups to export.
     * @remarks
     * For slow query monitoring with Database Insights, include 'slowquery'.
     * Possible values: ['error', 'general', 'slowquery', 'audit']
     * Note: 'general' logs everything and may impact performance.
     * @defaultValue `[]`
     */
    cloudwatchLogsExports?: string[];

    /**
     * Database Insights mode for advanced monitoring.
     * @remarks
     * Starting June 30, 2026, Performance Insights will be deprecated.
     * Use CloudWatch Database Insights for enhanced monitoring capabilities.
     * @defaultValue `DatabaseInsightsMode.STANDARD`
     * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html
     */
    databaseInsightsMode?: DatabaseInsightsMode;

    /**
     * Whether to enable cluster-level enhanced monitoring.
     * @defaultValue `false`
     */
    enableClusterLevelEnhancedMonitoring?: boolean;

    /**
     * Monitoring interval for enhanced monitoring.
     * @remarks
     * Only applicable if enableClusterLevelEnhancedMonitoring is true.
     * @defaultValue `Duration.seconds(60)`
     */
    monitoringInterval?: Duration;

    /**
     * Whether to enable IAM database authentication.
     * @defaultValue `true`
     */
    iamAuthentication?: boolean;

    /**
     * Removal policy for the cluster.
     * @defaultValue `RemovalPolicy.SNAPSHOT`
     */
    removalPolicy?: RemovalPolicy;

    /**
     * Whether to enable deletion protection.
     * @defaultValue `false`
     */
    deletionProtection?: boolean;

    /**
     * KMS key for storage encryption.
     * @remarks
     * If not provided, AWS-managed encryption will be used.
     * For production, consider using a customer-managed key with the createAuroraKmsKey utility.
     * @defaultValue AWS-managed encryption
     * @see {@link createAuroraKmsKey} for creating a customer-managed key
     */
    storageEncryptionKey?: IKey;

    /**
     * Automatically create a customer-managed KMS key for encryption.
     * @remarks
     * When true, a KMS key will be automatically created with:
     * - Automatic key rotation enabled
     * - RETAIN removal policy (for safety)
     * - 30-day pending deletion window
     *
     * If you need custom KMS configuration, create the key manually using createAuroraKmsKey.
     * @defaultValue `false`
     */
    createKmsKey?: boolean;

    /**
     * DB cluster snapshot identifier to restore from.
     * @remarks
     * If provided, the cluster will be created from this snapshot.
     * You can use either the name or ARN.
     * @example 'my-snapshot' or 'arn:aws:rds:us-east-1:123456789012:cluster-snapshot:my-snapshot'
     */
    snapshotIdentifier?: string;

    /**
     * Custom name for the Secrets Manager secret that will be created.
     * @remarks
     * The construct automatically creates a Secrets Manager secret for database credentials.
     * By default, the secret name will be `{clusterName}-credentials`.
     *
     * @example
     * ```typescript
     * const cluster = createAuroraMySqlCluster(this, 'Cluster', {
     *   clusterName: 'my-cluster',
     *   secretName: 'my-custom-secret-name',  // Optional
     *   // ... other props
     * });
     * ```
     *
     * @defaultValue `{clusterName}-credentials`
     */
    secretName?: string;

    /**
     * Reference to an existing Secrets Manager secret to use for credentials.
     * @remarks
     * Use this if you want to use a pre-existing secret instead of creating a new one.
     * The secret must contain 'username' and 'password' fields.
     *
     * @example
     * ```typescript
     * import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
     *
     * const existingSecret = Secret.fromSecretNameV2(this, 'Secret', 'my-existing-secret');
     *
     * const cluster = createAuroraMySqlCluster(this, 'Cluster', {
     *   existingSecret,
     *   // ... other props
     * });
     * ```
     *
     * @defaultValue A new secret will be created
     */
    existingSecret?: ISecret;

    /**
     * Credentials for snapshot restoration.
     * @remarks
     * Used when creating a cluster from a snapshot.
     * If not provided when using snapshotIdentifier, credentials will be generated from the secret.
     *
     * @defaultValue Generated from the secret
     */
    snapshotCredentials?: SnapshotCredentials;

    /**
     * Role for S3 import operations.
     * @remarks
     * For MySQL: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Integrating.LoadFromS3.html
     * For PostgreSQL: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.Migrating.html
     * @defaultValue New role created if s3ImportBuckets is set
     */
    s3ImportRole?: IRole;

    /**
     * S3 buckets for data import.
     * @defaultValue None
     */
    s3ImportBuckets?: IBucket[];

    /**
     * Role for S3 export operations.
     * @remarks
     * For MySQL: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Integrating.SaveIntoS3.html
     * For PostgreSQL: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/postgresql-s3-export.html
     * @defaultValue New role created if s3ExportBuckets is set
     */
    s3ExportRole?: IRole;

    /**
     * S3 buckets for data export.
     * @defaultValue None
     */
    s3ExportBuckets?: IBucket[];

    /**
     * CIDR blocks allowed to connect to the cluster.
     * @remarks
     * Security group rules will be created for each CIDR block.
     * @defaultValue Only VPC CIDR is allowed
     */
    allowedInboundCidrs?: string[];
};

/**
 * Aurora cluster resources returned by create functions.
 *
 * @public
 */
export type ClusterResources = {
    /** The created database cluster. */
    cluster: DatabaseCluster | DatabaseClusterFromSnapshot;

    /**
     * The Secrets Manager secret containing database credentials.
     * @remarks
     * Use this to grant access to the secret or reference it in other resources.
     */
    secret: ISecret;
};
