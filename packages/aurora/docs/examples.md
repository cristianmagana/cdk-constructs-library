# Examples

Real-world examples for common Aurora deployment scenarios.

## Table of Contents

- [Basic Development Cluster](#basic-development-cluster)
- [Production Cluster with Read Replicas](#production-cluster-with-read-replicas)
- [High-Performance Cluster](#high-performance-cluster)
- [Multi-Region Setup](#multi-region-setup)
- [Restore from Snapshot](#restore-from-snapshot)
- [S3 Data Import/Export](#s3-data-importexport)
- [Cross-Stack References](#cross-stack-references)
- [Complete Application Stack](#complete-application-stack)

## Basic Development Cluster

Simple Aurora MySQL cluster for development:

```typescript
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc, InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {Credentials, DatabaseClusterEngine, AuroraMysqlEngineVersion} from 'aws-cdk-lib/aws-rds';
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

export class DevDatabaseStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new Vpc(this, 'DevVPC', {
            maxAzs: 2,
        });

        const {cluster} = createAuroraMySqlCluster(this, 'DevCluster', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'dev-mysql-cluster',
            vpc,
            databaseName: 'devdb',
            credentials: Credentials.fromGeneratedSecret('admin'),
            writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
            clusterParameters: {
                name: 'dev-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Development cluster parameters',
            },
            instanceParameters: {
                name: 'dev-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Development instance parameters',
            },
        });
    }
}
```

## Production Cluster with Read Replicas

Production-ready Aurora MySQL with monitoring and read replicas:

```typescript
import {Stack, StackProps, RemovalPolicy, Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc, InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Key} from 'aws-cdk-lib/aws-kms';
import {Credentials, DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

export class ProdDatabaseStack extends Stack {
    public readonly cluster: DatabaseCluster;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Use existing VPC
        const vpc = Vpc.fromLookup(this, 'VPC', {
            vpcId: 'vpc-xxxxxxxxxxxxx',
        });

        // Create KMS key for encryption
        const kmsKey = new Key(this, 'DatabaseKey', {
            enableKeyRotation: true,
            description: 'KMS key for production Aurora cluster',
        });

        // Create database credentials
        const dbSecret = new Secret(this, 'DBSecret', {
            secretName: 'production/database/credentials',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: 'admin'}),
                generateStringKey: 'password',
                excludePunctuation: true,
                includeSpace: false,
            },
        });

        // Create production cluster
        const {cluster} = createAuroraMySqlCluster(this, 'ProdCluster', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'production-mysql-cluster',
            vpc,
            databaseName: 'production_db',
            credentials: Credentials.fromSecret(dbSecret),

            // Production instance types
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE),

            // Read replicas for scaling
            readersConfig: {
                readerInstanceCount: 2,
                instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            },

            // Advanced monitoring
            databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
            cloudwatchLogsExports: ['error', 'slowquery'],
            enableClusterLevelEnhancedMonitoring: true,
            monitoringInterval: Duration.seconds(60),

            // Security
            iamAuthentication: true,
            deletionProtection: true,
            storageEncryptionKey: kmsKey,
            allowedInboundCidrs: ['10.0.0.0/8'], // Internal network only

            // Backup
            removalPolicy: RemovalPolicy.RETAIN,

            // Optimized parameters
            clusterParameters: {
                name: 'prod-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Production cluster parameters',
                parameters: {
                    max_connections: '2000',
                    innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
                    slow_query_log: '1',
                    long_query_time: '2',
                },
            },

            instanceParameters: {
                name: 'prod-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Production instance parameters',
            },
        });

        this.cluster = cluster;
    }
}
```

## High-Performance Cluster

Aurora PostgreSQL optimized for high-performance workloads:

```typescript
import {createAuroraPostgresCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraPostgresEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';

const {cluster} = createAuroraPostgresCluster(this, 'HighPerfCluster', {
    engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_4,
    }),
    clusterName: 'high-performance-postgres',
    vpc,
    databaseName: 'analytics_db',
    credentials: Credentials.fromSecret(dbSecret),

    // Large instances for high performance
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE4),

    // Multiple readers for read distribution
    readersConfig: {
        readerInstanceCount: 3,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE2),
    },

    // Maximum monitoring
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['postgresql'],
    enableClusterLevelEnhancedMonitoring: true,
    monitoringInterval: Duration.seconds(30), // More frequent monitoring

    // Performance-tuned parameters
    clusterParameters: {
        name: 'high-perf-cluster-params',
        engine: DatabaseClusterEngine.auroraPostgres({
            version: AuroraPostgresEngineVersion.VER_16_4,
        }),
        description: 'High-performance cluster parameters',
        parameters: {
            max_connections: '5000',
            shared_buffers: '{DBInstanceClassMemory/16384}',
            effective_cache_size: '{DBInstanceClassMemory*3/4}',
            work_mem: '32768',
            maintenance_work_mem: '2097152',
            shared_preload_libraries: 'pg_stat_statements,auto_explain',
            random_page_cost: '1.1',
            effective_io_concurrency: '200',
        },
    },

    instanceParameters: {
        name: 'high-perf-instance-params',
        engine: DatabaseClusterEngine.auroraPostgres({
            version: AuroraPostgresEngineVersion.VER_16_4,
        }),
        description: 'High-performance instance parameters',
    },
});
```

## Multi-Region Setup

Deploy Aurora clusters in multiple regions for disaster recovery:

```typescript
import {App, Stack, StackProps} from 'aws-cdk-lib';

class DatabaseStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromLookup(this, 'VPC', {
            vpcId: process.env.VPC_ID!,
        });

        const {cluster} = createAuroraMySqlCluster(this, 'RegionalCluster', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: `mysql-${this.region}`,
            vpc,
            databaseName: 'mydb',
            credentials: Credentials.fromSecret(Secret.fromSecretNameV2(this, 'DBSecret', 'database/credentials')),
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            clusterParameters: {
                name: `cluster-params-${this.region}`,
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: `Cluster parameters for ${this.region}`,
            },
            instanceParameters: {
                name: `instance-params-${this.region}`,
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: `Instance parameters for ${this.region}`,
            },
        });
    }
}

// Deploy to multiple regions
const app = new App();

new DatabaseStack(app, 'DatabaseUSEast1', {
    env: {region: 'us-east-1'},
});

new DatabaseStack(app, 'DatabaseUSWest2', {
    env: {region: 'us-west-2'},
});
```

## Restore from Snapshot

Create a cluster from an existing snapshot:

```typescript
import {SnapshotCredentials} from 'aws-cdk-lib/aws-rds';

const {cluster} = createAuroraMySqlCluster(this, 'RestoredCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'restored-cluster',
    vpc,
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // Restore from snapshot
    snapshotIdentifier: 'arn:aws:rds:us-east-1:123456789012:cluster-snapshot:my-snapshot',
    snapshotCredentials: SnapshotCredentials.fromSecret(dbSecret),

    clusterParameters: {
        name: 'restored-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Restored cluster parameters',
    },

    instanceParameters: {
        name: 'restored-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Restored instance parameters',
    },
});
```

## S3 Data Import/Export

Configure S3 integration for data import/export:

```typescript
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Role, ServicePrincipal, ManagedPolicy} from 'aws-cdk-lib/aws-iam';

// Create S3 buckets
const importBucket = new Bucket(this, 'ImportBucket', {
    bucketName: 'my-import-bucket',
});

const exportBucket = new Bucket(this, 'ExportBucket', {
    bucketName: 'my-export-bucket',
});

// Create cluster with S3 integration
const {cluster} = createAuroraMySqlCluster(this, 'S3Cluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 's3-enabled-cluster',
    vpc,
    databaseName: 'mydb',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // S3 import/export configuration
    s3ImportBuckets: [importBucket],
    s3ExportBuckets: [exportBucket],

    clusterParameters: {
        name: 's3-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'S3-enabled cluster parameters',
    },

    instanceParameters: {
        name: 's3-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'S3-enabled instance parameters',
    },
});

// Use in SQL
// LOAD DATA FROM S3 's3://my-import-bucket/data.csv'
// INTO TABLE my_table;

// SELECT * FROM my_table
// INTO OUTFILE S3 's3://my-export-bucket/export.csv';
```

## Cross-Stack References

Share database across multiple stacks:

```typescript
// database-stack.ts
export class DatabaseStack extends Stack {
    public readonly cluster: DatabaseCluster;
    public readonly clusterEndpoint: string;
    public readonly clusterSecurityGroupId: string;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const {cluster} = createAuroraMySqlCluster(this, 'SharedCluster', {
            // ... configuration
        });

        this.cluster = cluster;
        this.clusterEndpoint = cluster.clusterEndpoint.hostname;
        this.clusterSecurityGroupId = cluster.connections.securityGroups[0].securityGroupId;

        // Export values for cross-stack reference
        new CfnOutput(this, 'ClusterEndpoint', {
            value: this.clusterEndpoint,
            exportName: 'DatabaseClusterEndpoint',
        });

        new CfnOutput(this, 'ClusterSecurityGroup', {
            value: this.clusterSecurityGroupId,
            exportName: 'DatabaseSecurityGroup',
        });
    }
}

// application-stack.ts
export class ApplicationStack extends Stack {
    constructor(scope: Construct, id: string, dbStack: DatabaseStack, props?: StackProps) {
        super(scope, id, props);

        // Reference the database cluster
        const dbEndpoint = dbStack.clusterEndpoint;
        const dbSecurityGroup = SecurityGroup.fromSecurityGroupId(this, 'DBSecurityGroup', dbStack.clusterSecurityGroupId);

        // Use in Lambda, ECS, etc.
        const lambda = new Function(this, 'MyFunction', {
            // ... configuration
            environment: {
                DB_HOST: dbEndpoint,
            },
        });

        // Allow Lambda to connect to database
        dbSecurityGroup.addIngressRule(lambda.connections.securityGroups[0], Port.tcp(3306));
    }
}

// app.ts
const app = new App();
const dbStack = new DatabaseStack(app, 'Database');
new ApplicationStack(app, 'Application', dbStack);
```

## Complete Application Stack

Full stack with VPC, Aurora, Lambda, and API Gateway:

```typescript
import {Stack, StackProps} from 'aws-cdk-lib';
import {Vpc, InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Credentials, DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {Function, Runtime, Code} from 'aws-cdk-lib/aws-lambda';
import {RestApi, LambdaIntegration} from 'aws-cdk-lib/aws-apigateway';
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

export class CompleteAppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new Vpc(this, 'VPC', {
            maxAzs: 2,
            natGateways: 1,
        });

        // Database credentials
        const dbSecret = new Secret(this, 'DBSecret', {
            secretName: 'app/database/credentials',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: 'admin'}),
                generateStringKey: 'password',
                excludePunctuation: true,
            },
        });

        // Aurora cluster
        const {cluster} = createAuroraMySqlCluster(this, 'Database', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'app-database',
            vpc,
            databaseName: 'appdb',
            credentials: Credentials.fromSecret(dbSecret),
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
            cloudwatchLogsExports: ['error', 'slowquery'],
            clusterParameters: {
                name: 'app-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Application cluster parameters',
            },
            instanceParameters: {
                name: 'app-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Application instance parameters',
            },
        });

        // Lambda function
        const apiFunction = new Function(this, 'ApiFunction', {
            runtime: Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: Code.fromAsset('lambda'),
            vpc,
            environment: {
                DB_HOST: cluster.clusterEndpoint.hostname,
                DB_PORT: cluster.clusterEndpoint.port.toString(),
                DB_NAME: 'appdb',
                DB_SECRET_ARN: dbSecret.secretArn,
            },
        });

        // Grant Lambda access to database secret
        dbSecret.grantRead(apiFunction);

        // Allow Lambda to connect to database
        cluster.connections.allowFrom(apiFunction, Port.tcp(3306));

        // API Gateway
        const api = new RestApi(this, 'Api', {
            restApiName: 'My Application API',
        });

        const integration = new LambdaIntegration(apiFunction);
        api.root.addMethod('GET', integration);
        api.root.addResource('items').addMethod('GET', integration);
    }
}
```

## Environment-Specific Configuration

Use different configurations per environment:

```typescript
interface EnvironmentConfig {
    instanceType: InstanceType;
    readerCount: number;
    deletionProtection: boolean;
    monitoring: boolean;
}

const configs: {[env: string]: EnvironmentConfig} = {
    dev: {
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
        readerCount: 0,
        deletionProtection: false,
        monitoring: false,
    },
    staging: {
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
        readerCount: 1,
        deletionProtection: false,
        monitoring: true,
    },
    production: {
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
        readerCount: 2,
        deletionProtection: true,
        monitoring: true,
    },
};

const env = process.env.ENVIRONMENT || 'dev';
const config = configs[env];

const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
    // ... common config
    writerInstanceType: config.instanceType,
    readersConfig:
        config.readerCount > 0
            ? {
                  readerInstanceCount: config.readerCount,
                  instanceType: config.instanceType,
              }
            : undefined,
    deletionProtection: config.deletionProtection,
    databaseInsightsMode: config.monitoring ? DatabaseInsightsMode.ADVANCED : DatabaseInsightsMode.STANDARD,
    // ... rest of config
});
```
