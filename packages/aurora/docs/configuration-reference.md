# Configuration Reference

Complete reference for all configuration options available in @cdk-constructs/aurora.

## Table of Contents

- [Common Configuration](#common-configuration)
- [MySQL-Specific Configuration](#mysql-specific-configuration)
- [PostgreSQL-Specific Configuration)](#postgresql-specific-configuration)
- [Monitoring Configuration](#monitoring-configuration)
- [Security Configuration](#security-configuration)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Configuration](#performance-configuration)
- [Networking Configuration](#networking-configuration)

## Common Configuration

These options apply to both MySQL and PostgreSQL clusters.

### Required Properties

#### `engine`

The Aurora database engine to use.

- **Type**: `IClusterEngine`
- **Required**: Yes
- **Example**:
    ```typescript
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    });
    ```

#### `clusterName`

Unique identifier for the cluster.

- **Type**: `string`
- **Required**: Yes
- **Constraints**: Must be unique within account and region
- **Example**: `'my-production-cluster'`

#### `vpc`

The VPC where the cluster will be deployed.

- **Type**: `IVpc`
- **Required**: Yes
- **Example**:
    ```typescript
    vpc: Vpc.fromLookup(this, 'VPC', {vpcId: 'vpc-xxxxx'});
    ```

#### `writerInstanceType`

Instance type for the writer (primary) instance.

- **Type**: `InstanceType`
- **Required**: Yes
- **Recommended**: ARM64 Graviton instances (R6G, T4G)
- **Example**:
    ```typescript
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
    ```

#### `databaseName`

Name of the database to create.

- **Type**: `string`
- **Required**: Yes
- **Example**: `'production_db'`

#### `clusterParameters`

Cluster-level parameter group configuration.

- **Type**: `ParameterGroupConfig`
- **Required**: Yes
- **Properties**:
    - `name` (string): Parameter group name
    - `engine` (IClusterEngine): Engine for parameter group
    - `description` (string): Description
    - `parameters` (object): Key-value parameter pairs
- **Example**:
    ```typescript
    clusterParameters: {
        name: 'my-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom cluster parameters',
        parameters: {
            'max_connections': '1000',
            'innodb_buffer_pool_size': '{DBInstanceClassMemory*3/4}',
        },
    };
    ```

#### `instanceParameters`

Instance-level parameter group configuration.

- **Type**: `ParameterGroupConfig`
- **Required**: Yes
- **Example**:
    ```typescript
    instanceParameters: {
        name: 'my-instance-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom instance parameters',
    };
    ```

### Optional Properties

#### `vpcSubnets`

Subnet selection for cluster deployment.

- **Type**: `SubnetSelection`
- **Default**: Private subnets
- **Example**:
    ```typescript
    vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    };
    ```

#### `readersConfig`

Configuration for read replica instances.

- **Type**: `ReaderConfig`
- **Default**: No readers
- **Properties**:
    - `readerInstanceCount` (number): Number of reader instances
    - `instanceType` (InstanceType): Instance type for readers
- **Example**:
    ```typescript
    readersConfig: {
        readerInstanceCount: 2,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    };
    ```

#### `credentials`

Database credentials for new clusters.

- **Type**: `Credentials`
- **Required**: Required when not restoring from snapshot
- **Example**:
    ```typescript
    credentials: Credentials.fromSecret(dbSecret);
    // or
    credentials: Credentials.fromGeneratedSecret('admin');
    ```

#### `snapshotIdentifier`

Snapshot to restore from.

- **Type**: `string`
- **Default**: None (new cluster)
- **Example**: `'my-snapshot-id'` or `'arn:aws:rds:...'`

#### `snapshotCredentials`

Credentials for snapshot restoration.

- **Type**: `SnapshotCredentials`
- **Default**: Generated secret with username 'admin'
- **Example**:
    ```typescript
    snapshotCredentials: SnapshotCredentials.fromSecret(dbSecret);
    ```

## Monitoring Configuration

### `databaseInsightsMode`

CloudWatch Database Insights monitoring level.

- **Type**: `DatabaseInsightsMode`
- **Default**: `DatabaseInsightsMode.STANDARD`
- **Options**:
    - `STANDARD`: Basic monitoring
    - `ADVANCED`: Enhanced monitoring with detailed query performance insights
- **Note**: When set to `ADVANCED`, `performanceInsightRetention` is automatically configured
- **Example**:
    ```typescript
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED;
    ```

### `cloudwatchLogsExports`

CloudWatch log groups to export.

- **Type**: `string[]`
- **Default**: `[]`
- **MySQL Options**: `['error', 'general', 'slowquery', 'audit']`
- **PostgreSQL Options**: `['postgresql']`
- **Warning**: 'general' logs everything and can impact performance
- **Example**:
    ```typescript
    cloudwatchLogsExports: ['error', 'slowquery'];
    ```

### `enableClusterLevelEnhancedMonitoring`

Enable enhanced monitoring at cluster level.

- **Type**: `boolean`
- **Default**: `false`
- **Example**: `true`

### `monitoringInterval`

Monitoring interval for enhanced monitoring.

- **Type**: `Duration`
- **Default**: `Duration.seconds(60)`
- **Required**: Only if `enableClusterLevelEnhancedMonitoring` is true
- **Example**:
    ```typescript
    monitoringInterval: Duration.seconds(30);
    ```

## Security Configuration

### `iamAuthentication`

Enable IAM database authentication.

- **Type**: `boolean`
- **Default**: `true`
- **Example**: `false` (to disable)

### `storageEncryptionKey`

KMS key for storage encryption.

- **Type**: `IKey`
- **Default**: AWS-managed key
- **Example**:
    ```typescript
    storageEncryptionKey: kms.Key.fromKeyArn(this, 'Key', 'arn:aws:kms:...');
    ```

### `allowedInboundCidrs`

Additional CIDR blocks allowed to connect.

- **Type**: `string[]`
- **Default**: Only VPC CIDR is allowed
- **Example**:
    ```typescript
    allowedInboundCidrs: ['10.0.0.0/8', '172.16.0.0/12'];
    ```

### `deletionProtection`

Prevent accidental cluster deletion.

- **Type**: `boolean`
- **Default**: `false`
- **Recommendation**: `true` for production
- **Example**: `true`

## Backup and Recovery

### `removalPolicy`

What happens when the stack is deleted.

- **Type**: `RemovalPolicy`
- **Default**: `RemovalPolicy.SNAPSHOT`
- **Options**:
    - `SNAPSHOT`: Create snapshot before deletion
    - `RETAIN`: Keep cluster after stack deletion
    - `DESTROY`: Delete without snapshot
- **Example**:
    ```typescript
    removalPolicy: RemovalPolicy.RETAIN;
    ```

## S3 Integration

### `s3ImportRole`

IAM role for S3 import operations.

- **Type**: `IRole`
- **Default**: Auto-created if `s3ImportBuckets` is set
- **Example**:
    ```typescript
    s3ImportRole: Role.fromRoleArn(this, 'ImportRole', 'arn:aws:iam:...');
    ```

### `s3ImportBuckets`

S3 buckets for data import.

- **Type**: `IBucket[]`
- **Default**: None
- **Example**:
    ```typescript
    s3ImportBuckets: [Bucket.fromBucketName(this, 'Bucket', 'my-bucket')];
    ```

### `s3ExportRole`

IAM role for S3 export operations.

- **Type**: `IRole`
- **Default**: Auto-created if `s3ExportBuckets` is set
- **Example**:
    ```typescript
    s3ExportRole: Role.fromRoleArn(this, 'ExportRole', 'arn:aws:iam:...');
    ```

### `s3ExportBuckets`

S3 buckets for data export.

- **Type**: `IBucket[]`
- **Default**: None
- **Example**:
    ```typescript
    s3ExportBuckets: [Bucket.fromBucketName(this, 'Bucket', 'my-bucket')];
    ```

## MySQL-Specific Configuration

### Recommended Engine Versions

```typescript
// Latest stable (recommended for new projects)
DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_09_0,
});

// Other supported versions
DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_08_2,
});
DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_07_1,
});
```

### MySQL-Specific Parameters

Common cluster parameters for MySQL:

```typescript
clusterParameters: {
    parameters: {
        'max_connections': '1000',
        'innodb_buffer_pool_size': '{DBInstanceClassMemory*3/4}',
        'character_set_server': 'utf8mb4',
        'collation_server': 'utf8mb4_unicode_ci',
        'slow_query_log': '1',
        'long_query_time': '2',
    },
};
```

### MySQL Log Exports

```typescript
cloudwatchLogsExports: [
    'error', // Error logs (recommended)
    'slowquery', // Slow query logs (recommended for performance tuning)
    'general', // All queries (high performance impact - use cautiously)
    'audit', // Audit logs (if audit plugin is enabled)
];
```

## PostgreSQL-Specific Configuration

### Recommended Engine Versions

```typescript
// Latest stable (recommended for new projects)
DatabaseClusterEngine.auroraPostgres({
    version: AuroraPostgresEngineVersion.VER_16_4,
});

// Other supported versions
DatabaseClusterEngine.auroraPostgres({
    version: AuroraPostgresEngineVersion.VER_15_8,
});
DatabaseClusterEngine.auroraPostgres({
    version: AuroraPostgresEngineVersion.VER_14_13,
});
```

### PostgreSQL-Specific Parameters

Common cluster parameters for PostgreSQL:

```typescript
clusterParameters: {
    parameters: {
        'max_connections': '1000',
        'shared_buffers': '{DBInstanceClassMemory/32768}',
        'effective_cache_size': '{DBInstanceClassMemory*3/4}',
        'work_mem': '16384',
        'shared_preload_libraries': 'pg_stat_statements',
        'log_min_duration_statement': '2000',
    },
};
```

### PostgreSQL Log Exports

```typescript
cloudwatchLogsExports: ['postgresql'];
```

## Instance Types

### Development/Testing

```typescript
// Burstable (T4G) - cost-effective for dev/test
InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM);
InstanceType.of(InstanceClass.T4G, InstanceSize.LARGE);
```

### Production

```typescript
// Memory-optimized (R6G) - recommended for production
InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE);
InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE2);

// General purpose (M6G) - balanced compute/memory
InstanceType.of(InstanceClass.M6G, InstanceSize.LARGE);
InstanceType.of(InstanceClass.M6G, InstanceSize.XLARGE);
```

### High Performance

```typescript
// Memory-optimized with local NVMe SSD (R6GD)
InstanceType.of(InstanceClass.R6GD, InstanceSize.XLARGE);

// High memory (X2G)
InstanceType.of(InstanceClass.X2G, InstanceSize.XLARGE);
```

## Complete Configuration Example

```typescript
const {cluster} = createAuroraMySqlCluster(this, 'ProductionCluster', {
    // Engine
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),

    // Basic settings
    clusterName: 'production-mysql-cluster',
    vpc,
    databaseName: 'production_db',
    credentials: Credentials.fromSecret(dbSecret),

    // Instance configuration
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE),
    readersConfig: {
        readerInstanceCount: 2,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    },

    // Monitoring
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'],
    enableClusterLevelEnhancedMonitoring: true,
    monitoringInterval: Duration.seconds(60),

    // Security
    iamAuthentication: true,
    deletionProtection: true,
    storageEncryptionKey: myKmsKey,
    allowedInboundCidrs: ['10.0.0.0/8'],

    // Backup
    removalPolicy: RemovalPolicy.RETAIN,

    // Parameters
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
