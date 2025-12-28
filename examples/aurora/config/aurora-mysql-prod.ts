import {DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {RemovalPolicy} from 'aws-cdk-lib';
import {AuroraMySqlClusterProps} from '@cdk-constructs/aurora';

/**
 * Production environment configuration for Aurora MySQL.
 *
 * @remarks
 * Replace the vpcId and subnetIds with your actual VPC and private subnet IDs.
 * Production best practices:
 * - Use at least 3 subnets across different Availability Zones
 * - Enable deletion protection
 * - Use customer-managed KMS keys
 * - Enable advanced monitoring and logging
 */
export const MYSQL_PROD_CONFIG: AuroraMySqlClusterProps = {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'aurora-mysql-prod',
    // Replace with your VPC ID (or override via environments.local.ts)
    vpcId: 'vpc-xxxxxxxxxxxxxxxxx',
    // Replace with your private subnet IDs (minimum 3 for production multi-AZ)
    subnetIds: ['subnet-xxxxxxxxxxxxxxxxx', 'subnet-yyyyyyyyyyyyyyyyy', 'subnet-zzzzzzzzzzzzzzzzz'],
    databaseName: 'prod_database',
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // High availability with read replicas
    readersConfig: {
        readerInstanceCount: 2,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    },

    // Monitoring - Advanced for prod (demonstrates all monitoring features)
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery', 'general', 'audit'],
    enableClusterLevelEnhancedMonitoring: true,
    // monitoringInterval defaults to Duration.seconds(60) when enhanced monitoring is enabled

    // Security - Production hardening
    iamAuthentication: true,
    deletionProtection: false,
    removalPolicy: RemovalPolicy.DESTROY,
    createKmsKey: true, // Customer-managed KMS key

    // Parameter groups (names will be auto-generated)
    clusterParameters: {
        description: 'Production cluster parameters',
        parameters: {
            max_connections: '2000',
            slow_query_log: '1',
            long_query_time: '2',
        },
    },
    instanceParameters: {
        description: 'Production instance parameters',
    },

    // Additional CIDR blocks allowed to connect (if needed)
    // allowedInboundCidrs: ['10.0.0.0/16'],
};
