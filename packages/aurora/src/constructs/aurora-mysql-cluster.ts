import {
    ClusterInstance,
    Credentials,
    DatabaseCluster,
    DatabaseClusterFromSnapshot,
    DatabaseInsightsMode,
    PerformanceInsightRetention,
    SnapshotCredentials,
} from 'aws-cdk-lib/aws-rds';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Construct} from 'constructs';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {AuroraMySqlClusterProps} from '../types/aurora-mysql-cluster';
import {
    createClusterParameterGroup,
    createInstanceParameterGroup,
    createAuroraSecurityGroup,
    createClusterReaders,
    caCertificate,
} from '../util/aurora-helpers';
import {createAuroraKmsKey} from '../util/kms-helpers';
import {getVpc, selectSubnetsByIds} from '../util/vpc-helpers';
import {ClusterResources} from '../types/aurora-cluster-base';

/**
 * Creates an Aurora MySQL cluster with CloudWatch Database Insights support.
 *
 * @remarks
 * This construct creates a production-ready Aurora MySQL cluster with:
 * - CloudWatch Database Insights for advanced monitoring (replaces deprecated Performance Insights)
 * - Flexible engine version support (no forced upgrades)
 * - Custom parameter groups for cluster and instance configuration
 * - Optional read replicas
 * - Encryption at rest
 * - VPC integration with security groups
 *
 * Starting June 30, 2026, Performance Insights will be deprecated.
 * This construct uses CloudWatch Database Insights for enhanced monitoring.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the MySQL cluster
 * @returns Cluster resources including the database cluster
 *
 * @example
 * ```typescript
 * import {DatabaseClusterEngine, AuroraMysqlEngineVersion} from 'aws-cdk-lib/aws-rds';
 * import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
 *
 * const {cluster, secret} = createAuroraMySqlCluster(this, {
 *   engine: DatabaseClusterEngine.auroraMysql({
 *     version: AuroraMysqlEngineVersion.VER_3_09_0
 *   }),
 *   clusterName: 'my-mysql-cluster',
 *   vpcId: 'vpc-xxxxxxxxxxxxx',
 *   subnetIds: ['subnet-abc123', 'subnet-def456', 'subnet-ghi789'],
 *   writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
 *   databaseName: 'mydb',
 *   databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
 *   cloudwatchLogsExports: ['error', 'slowquery'],
 *   clusterParameters: {
 *     description: 'Custom cluster parameters',
 *   },
 *   instanceParameters: {
 *     description: 'Custom instance parameters',
 *   },
 * });
 * ```
 *
 * @see {@link AuroraMySqlClusterProps} for configuration options
 * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html
 * @public
 */
export const createAuroraMySqlCluster = (scope: Construct, props: AuroraMySqlClusterProps): ClusterResources => {
    const vpc = getVpc(scope, `${props.clusterName}-vpc`, props.vpcId);

    const vpcSubnets = selectSubnetsByIds(vpc, props.subnetIds);

    const clusterParameterGroup = createClusterParameterGroup(scope, props);
    const instanceParameterGroup = createInstanceParameterGroup(scope, props);
    const securityGroup = createAuroraSecurityGroup(scope, `${props.clusterName}-sg`, vpc, 3306, props);

    const secret =
        props.existingSecret ||
        new Secret(scope, `${props.clusterName}-secret`, {
            secretName: props.secretName || `${props.clusterName}-credentials`,
            description: `Database credentials for ${props.clusterName}`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: 'admin'}),
                generateStringKey: 'password',
                excludePunctuation: true,
                passwordLength: 32,
            },
        });

    const credentials = Credentials.fromSecret(secret);

    const kmsKey =
        props.createKmsKey && !props.storageEncryptionKey
            ? createAuroraKmsKey(scope, `${props.clusterName}-kms`, {
                  clusterName: props.clusterName,
              })
            : props.storageEncryptionKey;

    const commonClusterConfig = {
        engine: props.engine,
        clusterIdentifier: props.clusterName,
        vpc,
        vpcSubnets,
        securityGroups: [securityGroup],
        writer: ClusterInstance.provisioned('writer', {
            instanceIdentifier: `${props.clusterName}-writer`,
            allowMajorVersionUpgrade: false,
            parameterGroup: instanceParameterGroup,
            caCertificate,
            publiclyAccessible: false,
            instanceType: props.writerInstanceType,
        }),
        readers: createClusterReaders(props, instanceParameterGroup),
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        parameterGroup: clusterParameterGroup,
        iamAuthentication: props.iamAuthentication !== undefined ? props.iamAuthentication : true,
        removalPolicy: props.removalPolicy || RemovalPolicy.SNAPSHOT,
        deletionProtection: props.deletionProtection || false,
        // CloudWatch Database Insights (replaces Performance Insights)
        databaseInsightsMode: props.databaseInsightsMode || DatabaseInsightsMode.STANDARD,
        // When Database Insights is ADVANCED, Performance Insights retention must be set to MONTHS_15
        performanceInsightRetention: props.databaseInsightsMode === DatabaseInsightsMode.ADVANCED ? PerformanceInsightRetention.MONTHS_15 : undefined,
        cloudwatchLogsExports: props.cloudwatchLogsExports || [],
        enableClusterLevelEnhancedMonitoring: props.enableClusterLevelEnhancedMonitoring || false,
        monitoringInterval: props.enableClusterLevelEnhancedMonitoring ? props.monitoringInterval || Duration.seconds(60) : undefined,
        // S3 import/export
        s3ImportRole: props.s3ImportRole,
        s3ImportBuckets: props.s3ImportBuckets,
        s3ExportRole: props.s3ExportRole,
        s3ExportBuckets: props.s3ExportBuckets,
    };

    const cluster = props.snapshotIdentifier
        ? new DatabaseClusterFromSnapshot(scope, props.clusterName, {
              ...commonClusterConfig,
              snapshotIdentifier: props.snapshotIdentifier,
              snapshotCredentials: props.snapshotCredentials || SnapshotCredentials.fromGeneratedSecret('admin'),
          })
        : new DatabaseCluster(scope, props.clusterName, {
              ...commonClusterConfig,
              credentials,
          });

    return {cluster, secret};
};
