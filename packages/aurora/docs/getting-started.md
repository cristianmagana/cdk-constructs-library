# Getting Started with @cdk-constructs/aurora

This guide will help you get started with creating Aurora database clusters using the @cdk-constructs/aurora package.

## Prerequisites

- AWS CDK 2.225.0 or later
- Node.js 24 or later
- An AWS account with appropriate permissions
- A VPC configured for your Aurora cluster

## Installation

Install the package in your CDK project:

```bash
npm install @cdk-constructs/aurora
```

## Your First Aurora Cluster

### Step 1: Set Up Your CDK Stack

Create a new CDK stack or use an existing one:

```typescript
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from 'aws-cdk-lib/aws-ec2';

export class MyDatabaseStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Your Aurora cluster will go here
    }
}
```

### Step 2: Reference or Create a VPC

Aurora clusters must be deployed in a VPC. You can either reference an existing VPC or create a new one:

**Reference an existing VPC:**

```typescript
import {Vpc} from 'aws-cdk-lib/aws-ec2';

const vpc = Vpc.fromLookup(this, 'VPC', {
    vpcId: 'vpc-xxxxxxxxxxxxx',
});
```

**Create a new VPC:**

```typescript
import {Vpc} from 'aws-cdk-lib/aws-ec2';

const vpc = new Vpc(this, 'VPC', {
    maxAzs: 2, // Aurora requires at least 2 AZs
});
```

### Step 3: Create Database Credentials

You'll need to provide credentials for the database. The recommended approach is to use AWS Secrets Manager:

**Create a new secret:**

```typescript
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Credentials} from 'aws-cdk-lib/aws-rds';

const dbSecret = new Secret(this, 'DBSecret', {
    secretName: 'my-database-secret',
    generateSecretString: {
        secretStringTemplate: JSON.stringify({username: 'admin'}),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
    },
});

const credentials = Credentials.fromSecret(dbSecret);
```

**Reference an existing secret:**

```typescript
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Credentials} from 'aws-cdk-lib/aws-rds';

const dbSecret = Secret.fromSecretNameV2(this, 'DBSecret', 'my-existing-secret');
const credentials = Credentials.fromSecret(dbSecret);
```

### Step 4: Create an Aurora MySQL Cluster

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraMySqlCluster(this, 'MySQLCluster', {
    // Engine configuration
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),

    // Basic cluster settings
    clusterName: 'my-mysql-cluster',
    vpc,
    databaseName: 'mydatabase',
    credentials,

    // Instance configuration
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // Parameter groups (required)
    clusterParameters: {
        name: 'my-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom cluster parameter group',
    },

    instanceParameters: {
        name: 'my-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom instance parameter group',
    },
});
```

### Step 5: Create an Aurora PostgreSQL Cluster

```typescript
import {createAuroraPostgresCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraPostgresEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraPostgresCluster(this, 'PostgresCluster', {
    // Engine configuration
    engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_4,
    }),

    // Basic cluster settings
    clusterName: 'my-postgres-cluster',
    vpc,
    databaseName: 'mydatabase',
    credentials,

    // Instance configuration
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // Parameter groups (required)
    clusterParameters: {
        name: 'my-cluster-params',
        engine: DatabaseClusterEngine.auroraPostgres({
            version: AuroraPostgresEngineVersion.VER_16_4,
        }),
        description: 'Custom cluster parameter group',
    },

    instanceParameters: {
        name: 'my-instance-params',
        engine: DatabaseClusterEngine.auroraPostgres({
            version: AuroraPostgresEngineVersion.VER_16_4,
        }),
        description: 'Custom instance parameter group',
    },
});
```

### Step 6: Deploy Your Stack

```bash
cdk deploy
```

## Complete Example

Here's a complete, working example:

```typescript
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc, InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Credentials, DatabaseClusterEngine, AuroraMysqlEngineVersion} from 'aws-cdk-lib/aws-rds';
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

export class DatabaseStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create VPC
        const vpc = new Vpc(this, 'VPC', {
            maxAzs: 2,
        });

        // Create database secret
        const dbSecret = new Secret(this, 'DBSecret', {
            secretName: 'my-database-secret',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: 'admin'}),
                generateStringKey: 'password',
                excludePunctuation: true,
                includeSpace: false,
            },
        });

        // Create Aurora MySQL cluster
        const {cluster} = createAuroraMySqlCluster(this, 'MySQLCluster', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'my-mysql-cluster',
            vpc,
            databaseName: 'mydatabase',
            credentials: Credentials.fromSecret(dbSecret),
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            clusterParameters: {
                name: 'my-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Custom cluster parameters',
            },
            instanceParameters: {
                name: 'my-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                description: 'Custom instance parameters',
            },
        });
    }
}
```

## Next Steps

- [Configuration Reference](./configuration-reference.md) - Learn about all available configuration options
- [Best Practices](./best-practices.md) - Follow production-ready patterns
- [Examples](./examples.md) - See more advanced usage examples
- [Migration Guide](./migration-guide.md) - Migrate from other Aurora solutions

## Troubleshooting

### Error: "VPC must have at least 2 subnets"

Aurora requires at least 2 subnets in different availability zones. Make sure your VPC has subnets in at least 2 AZs.

### Error: "performanceInsightRetention must be set"

When using `DatabaseInsightsMode.ADVANCED`, the package automatically sets the required `performanceInsightRetention`. If you see this error, please file an issue.

### Connection Timeout

Make sure your application has network access to the Aurora cluster. Check:

- Security group rules
- VPC subnet configuration
- NAT gateway configuration (if connecting from public internet)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/cristianmagana/cdk-constructs-library).
