import {DatabaseClusterEngine, AuroraPostgresEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {RemovalPolicy} from 'aws-cdk-lib';
import {AuroraPostgresClusterProps} from '@cdk-constructs/aurora';

/**
 * Development environment configuration for Aurora PostgreSQL.
 *
 * @remarks
 * Replace the vpcId and subnetIds with your actual VPC and private subnet IDs.
 * You can find these in the AWS Console or by running:
 * - VPC ID: `aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0]]' --output table`
 * - Subnet IDs: `aws ec2 describe-subnets --filters "Name=vpc-id,Values=YOUR_VPC_ID" --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]' --output table`
 */
export const POSTGRES_DEV_CONFIG: AuroraPostgresClusterProps = {
    engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_4,
    }),
    clusterName: 'aurora-postgres-dev',
    // Replace with your VPC ID (or override via environments.local.ts)
    vpcId: 'vpc-xxxxxxxxxxxxxxxxx',
    // Replace with your private subnet IDs (minimum 2, recommend 3 for multi-AZ)
    subnetIds: ['subnet-xxxxxxxxxxxxxxxxx', 'subnet-yyyyyyyyyyyyyyyyy', 'subnet-zzzzzzzzzzzzzzzzz'],
    databaseName: 'dev_database',
    writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),

    // Monitoring - Standard for dev
    databaseInsightsMode: DatabaseInsightsMode.STANDARD,
    cloudwatchLogsExports: ['postgresql'],

    // Security - Less restrictive for dev
    iamAuthentication: true,
    deletionProtection: false,
    removalPolicy: RemovalPolicy.DESTROY,
    createKmsKey: false, // Use AWS-managed encryption for dev

    // Parameter groups (names will be auto-generated)
    clusterParameters: {
        description: 'Development cluster parameters',
        parameters: {
            max_connections: '500',
        },
    },
    instanceParameters: {
        description: 'Development instance parameters',
    },

    // No read replicas for dev
    readersConfig: {
        readerInstanceCount: 0,
    },
};
