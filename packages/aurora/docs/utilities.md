# Utility Functions

Helper functions to simplify common Aurora deployment tasks.

## Table of Contents

- [VPC Utilities](#vpc-utilities)
- [KMS Key Utilities](#kms-key-utilities)
- [Usage Examples](#usage-examples)

## VPC Utilities

Simplify VPC lookup and subnet selection operations.

### `getVpc`

Look up an existing VPC by ID.

```typescript
import {getVpc} from '@cdk-constructs/aurora';

const vpc = getVpc(this, 'VPC', 'vpc-xxxxxxxxxxxxx');
```

**Parameters:**

- `scope` - The construct scope
- `id` - Unique identifier for this construct
- `vpcId` - The VPC ID to lookup

**Returns:** `IVpc` - The VPC interface

### `selectSubnetsByIds`

Select specific subnets from a VPC by subnet IDs.

```typescript
import {getVpc, selectSubnetsByIds} from '@cdk-constructs/aurora';

const vpc = getVpc(this, 'VPC', 'vpc-xxxxxxxxxxxxx');
const subnetSelection = selectSubnetsByIds(vpc, ['subnet-abc123', 'subnet-def456', 'subnet-ghi789']);
```

**Parameters:**

- `vpc` - The VPC to select subnets from
- `subnetIds` - Array of subnet IDs to select

**Returns:** `SubnetSelection` - The filtered subnet selection

**Note:** This function filters from the VPC's private subnets only.

## KMS Key Utilities

Simplify KMS key creation for Aurora encryption.

### `createAuroraKmsKey`

Create a customer-managed KMS key with Aurora-optimized defaults.

```typescript
import {createAuroraKmsKey} from '@cdk-constructs/aurora';
import {RemovalPolicy} from 'aws-cdk-lib';

const kmsKey = createAuroraKmsKey(this, 'DatabaseKey', {
    clusterName: 'my-cluster',
    description: 'KMS key for production Aurora cluster',
    removalPolicy: RemovalPolicy.RETAIN, // For production
    enableKeyRotation: true, // Default
    pendingWindowDays: 30, // Default
});
```

**Features**:

- Automatic key rotation enabled by default
- Account root principal access
- Configurable removal policy
- 30-day pending deletion window (default)
- Proper alias naming

### Automatic KMS Key Creation

Alternatively, use the `createKmsKey` property for automatic key creation:

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
    // ... other config
    createKmsKey: true, // Automatically creates a KMS key with safe defaults
});
```

**What it creates**:

- KMS key with automatic rotation
- RETAIN removal policy (safe for production)
- 30-day pending deletion window
- Alias: `alias/{clusterName}-aurora-key`

## Usage Examples

### Example 1: Simple Development Setup

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraMySqlCluster(this, 'DevCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'dev-cluster',
    vpcId: 'vpc-xxxxxxxxxxxxx',
    databaseName: 'devdb',
    credentials: Credentials.fromGeneratedSecret('admin'),
    writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
    clusterParameters: {
        name: 'dev-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Development parameters',
    },
    instanceParameters: {
        name: 'dev-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Development instance parameters',
    },
});
```

### Example 1a: Development Setup with Specific Subnets

```typescript
import {createAuroraMySqlCluster, getVpc, selectSubnetsByIds} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

// Lookup VPC and select specific subnets
const vpc = getVpc(this, 'VPC', 'vpc-xxxxxxxxxxxxx');
const subnetSelection = selectSubnetsByIds(vpc, ['subnet-abc123', 'subnet-def456', 'subnet-ghi789']);

const {cluster} = createAuroraMySqlCluster(this, 'DevCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'dev-cluster',
    vpcId: 'vpc-xxxxxxxxxxxxx',
    vpcSubnets: subnetSelection,
    databaseName: 'devdb',
    credentials: Credentials.fromGeneratedSecret('admin'),
    writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
    clusterParameters: {
        name: 'dev-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Development parameters',
    },
    instanceParameters: {
        name: 'dev-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Development instance parameters',
    },
});
```

### Example 2: Production with Custom KMS

```typescript
import {createAuroraMySqlCluster, createAuroraKmsKey} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {RemovalPolicy} from 'aws-cdk-lib';

// Create customer-managed KMS key
const kmsKey = createAuroraKmsKey(this, 'ProdDatabaseKey', {
    clusterName: 'production-cluster',
    description: 'Production Aurora cluster encryption key',
    removalPolicy: RemovalPolicy.RETAIN,
    enableKeyRotation: true,
    pendingWindowDays: 30,
});

// Get database credentials from Secrets Manager
const dbSecret = Secret.fromSecretNameV2(this, 'DBSecret', 'production/database/credentials');

const {cluster} = createAuroraMySqlCluster(this, 'ProdCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'production-cluster',
    vpcId: 'vpc-xxxxxxxxxxxxx',
    databaseName: 'production_db',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE),

    // Read replicas
    readersConfig: {
        readerInstanceCount: 2,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    },

    // Advanced monitoring
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'],

    // Security
    storageEncryptionKey: kmsKey,
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,

    clusterParameters: {
        name: 'prod-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Production cluster parameters',
        parameters: {
            max_connections: '2000',
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
```

### Example 3: Automatic KMS Key Creation

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'my-cluster',
    vpcId: 'vpc-xxxxxxxxxxxxx',
    databaseName: 'mydb',
    credentials: Credentials.fromGeneratedSecret('admin'),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),

    // Automatically create KMS key with safe defaults
    createKmsKey: true,

    clusterParameters: {
        name: 'my-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom parameters',
    },

    instanceParameters: {
        name: 'my-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Instance parameters',
    },
});
```

### Example 4: Multi-Environment Setup

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {RemovalPolicy} from 'aws-cdk-lib';

interface EnvironmentConfig {
    vpcId: string;
    instanceType: InstanceType;
    createKmsKey: boolean;
    deletionProtection: boolean;
    removalPolicy: RemovalPolicy;
}

const envConfigs: {[env: string]: EnvironmentConfig} = {
    dev: {
        vpcId: 'vpc-dev123456789',
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
        createKmsKey: false, // Use AWS-managed key for dev
        deletionProtection: false,
        removalPolicy: RemovalPolicy.DESTROY,
    },
    prod: {
        vpcId: 'vpc-prod987654321',
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE),
        createKmsKey: true, // Customer-managed key for production
        deletionProtection: true,
        removalPolicy: RemovalPolicy.RETAIN,
    },
};

const env = process.env.ENVIRONMENT || 'dev';
const config = envConfigs[env];

const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: `my-cluster-${env}`,
    vpcId: config.vpcId,
    databaseName: 'mydb',
    credentials: Credentials.fromGeneratedSecret('admin'),
    writerInstanceType: config.instanceType,
    createKmsKey: config.createKmsKey,
    deletionProtection: config.deletionProtection,
    removalPolicy: config.removalPolicy,
    clusterParameters: {
        name: `cluster-params-${env}`,
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: `${env} cluster parameters`,
    },
    instanceParameters: {
        name: `instance-params-${env}`,
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: `${env} instance parameters`,
    },
});
```

## Best Practices

### VPC Lookup

✅ **Do**: Use getVpc for existing infrastructure

```typescript
const vpc = getVpc(this, 'VPC', 'vpc-xxxxx');
```

✅ **Do**: Use environment variables or configuration for VPC IDs

```typescript
const vpcId = process.env.VPC_ID || 'vpc-default';
const vpc = getVpc(this, 'VPC', vpcId);
```

❌ **Don't**: Hardcode VPC IDs directly in code

### KMS Keys

✅ **Do**: Use customer-managed keys for production

```typescript
const kmsKey = createAuroraKmsKey(this, 'Key', {
    clusterName: 'prod-cluster',
    removalPolicy: RemovalPolicy.RETAIN,
});
```

✅ **Do**: Use `createKmsKey: true` for simple setups

```typescript
createAuroraMySqlCluster(this, 'Cluster', {
    createKmsKey: true,
    // ...
});
```

✅ **Do**: Use RETAIN removal policy for production keys

```typescript
removalPolicy: RemovalPolicy.RETAIN;
```

❌ **Don't**: Use DESTROY removal policy for production
❌ **Don't**: Skip encryption for production databases

## API Reference

### VPC Utilities

- `getVpc(scope: Construct, id: string, vpcId: string): IVpc`
- `selectSubnetsByIds(vpc: IVpc, subnetIds: string[]): SubnetSelection`

### KMS Utilities

- `createAuroraKmsKey(scope: Construct, id: string, config: KmsKeyConfig): Key`

### Configuration Types

- `KmsKeyConfig`: Configuration for KMS key creation
    - `clusterName: string` - Cluster name for naming the key
    - `description?: string` - Optional description
    - `removalPolicy?: RemovalPolicy` - Removal policy (default: RETAIN)
    - `pendingWindowDays?: number` - Pending deletion window (default: 30)
    - `enableKeyRotation?: boolean` - Enable rotation (default: true)

## See Also

- [Getting Started](./getting-started.md) - Basic setup guide
- [Examples](./examples.md) - More usage examples
- [Best Practices](./best-practices.md) - Security and performance tips
