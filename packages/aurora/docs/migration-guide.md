# Migration Guide

Guide for migrating to @cdk-constructs/aurora from other Aurora solutions.

## Table of Contents

- [From AWS CDK L2 Constructs](#from-aws-cdk-l2-constructs)
- [From Custom Aurora Solutions](#from-custom-aurora-solutions)
- [From Performance Insights to Database Insights](#from-performance-insights-to-database-insights)
- [Version Upgrade Strategy](#version-upgrade-strategy)
- [Zero-Downtime Migration](#zero-downtime-migration)

## From AWS CDK L2 Constructs

If you're currently using the native CDK `DatabaseCluster` construct, here's how to migrate.

### Before (Native CDK)

```typescript
import {DatabaseCluster, DatabaseClusterEngine, AuroraMysqlEngineVersion, ClusterInstance} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const cluster = new DatabaseCluster(this, 'Database', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    credentials: Credentials.fromSecret(dbSecret),
    writer: ClusterInstance.provisioned('writer', {
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    }),
    readers: [
        ClusterInstance.provisioned('reader1', {
            instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
        }),
    ],
    vpc,
    storageEncrypted: true,
    iamAuthentication: true,
    // ... many more individual configurations
});
```

### After (@cdk-constructs/aurora)

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraMySqlCluster(this, 'Database', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'my-cluster',
    vpc,
    databaseName: 'mydb',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    readersConfig: {
        readerInstanceCount: 1,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    },
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
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
```

### Key Differences

| Feature          | Native CDK           | @cdk-constructs/aurora     |
| ---------------- | -------------------- | -------------------------- |
| Configuration    | Multiple properties  | Structured props object    |
| Parameter Groups | Optional             | Required (best practice)   |
| Readers          | Array of instances   | Simple count + type        |
| Monitoring       | Manual setup         | Database Insights built-in |
| Security         | Manual configuration | Secure defaults            |

### Migration Steps

1. **Install the package**:

    ```bash
    npm install @cdk-constructs/aurora
    ```

2. **Update imports**:

    ```typescript
    import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
    ```

3. **Create parameter groups**:

    ```typescript
    clusterParameters: {
        name: 'my-cluster-params',
        engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_3_09_0,
        }),
        description: 'Custom cluster parameters',
        parameters: {
            // Your existing parameters
        },
    }
    ```

4. **Simplify reader configuration**:

    ```typescript
    // Before: Array of ClusterInstance
    readers: [
        ClusterInstance.provisioned('reader1', {...}),
        ClusterInstance.provisioned('reader2', {...}),
    ]

    // After: Simple configuration
    readersConfig: {
        readerInstanceCount: 2,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    }
    ```

5. **Enable Database Insights**:

    ```typescript
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'],
    ```

6. **Deploy with caution**:

    ```bash
    # Preview changes first
    cdk diff

    # Deploy
    cdk deploy
    ```

## From Custom Aurora Solutions

If you have custom Aurora wrapper constructs, here's how to migrate.

### Identify Your Current Configuration

First, document your current setup:

```typescript
// What engine and version?
engine: DatabaseClusterEngine.auroraMysql({version: ?})

// What instance types?
writerInstanceType: ?
readerInstanceType: ?

// How many readers?
readerCount: ?

// What monitoring is enabled?
performanceInsights: ?
enhancedMonitoring: ?

// What parameters are customized?
clusterParameters: ?
instanceParameters: ?
```

### Map to @cdk-constructs/aurora

Use this mapping table:

| Your Config           | @cdk-constructs/aurora              |
| --------------------- | ----------------------------------- |
| `writerInstance`      | `writerInstanceType`                |
| `readerInstances`     | `readersConfig.readerInstanceCount` |
| `performanceInsights` | `databaseInsightsMode`              |
| `customParameters`    | `clusterParameters.parameters`      |
| `securityGroups`      | `allowedInboundCidrs`               |

### Example Migration

**Before (Custom Solution)**:

```typescript
class MyAuroraCluster extends Construct {
    createCluster(config: MyCustomConfig) {
        // 200+ lines of custom logic
        const cluster = new DatabaseCluster(...);
        this.setupMonitoring(cluster);
        this.setupBackups(cluster);
        this.setupParameters(cluster);
        // etc.
    }
}
```

**After (@cdk-constructs/aurora)**:

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';

const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
    // All your configuration in one place
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'my-cluster',
    vpc,
    databaseName: 'mydb',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    // ... rest of config
});
```

## From Performance Insights to Database Insights

AWS is deprecating Performance Insights on June 30, 2026. Here's how to migrate.

### Why Migrate?

CloudWatch Database Insights offers:

- **Fleet-level monitoring** - Monitor all databases from one dashboard
- **Application integration** - Correlate database and application performance
- **Lock analysis** - Identify and resolve lock contention
- **Extended retention** - Longer retention than Performance Insights

### Migration Steps

#### Step 1: Update Configuration

**Before (Performance Insights)**:

```typescript
{
    enablePerformanceInsights: true,
    performanceInsightRetention: PerformanceInsightRetention.LONG_TERM,
}
```

**After (Database Insights)**:

```typescript
{
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'], // MySQL
    // cloudwatchLogsExports: ['postgresql'], // PostgreSQL
}
```

#### Step 2: Enable Required Logs

For Database Insights to work effectively, you need to export logs:

**MySQL**:

```typescript
{
    cloudwatchLogsExports: ['error', 'slowquery'],
    clusterParameters: {
        parameters: {
            'slow_query_log': '1',
            'long_query_time': '2',
        },
    },
}
```

**PostgreSQL**:

```typescript
{
    cloudwatchLogsExports: ['postgresql'],
    clusterParameters: {
        parameters: {
            'log_min_duration_statement': '2000',
            'shared_preload_libraries': 'pg_stat_statements',
        },
    },
}
```

#### Step 3: Update Monitoring Dashboards

If you have CloudWatch dashboards using Performance Insights metrics, update them to use Database Insights metrics instead.

**Performance Insights Metrics** (deprecated):

- `PerformanceInsights.DatabaseLoad`
- `PerformanceInsights.ActiveSessions`

**Database Insights Metrics** (new):

- `DatabaseInsights.DatabaseLoad`
- `DatabaseInsights.QueryExecutionTime`
- `DatabaseInsights.LockWaitTime`

#### Step 4: Update IAM Permissions

Database Insights requires different permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["rds:DescribeDBClusters", "rds:DescribeDBInstances", "cloudwatch:GetMetricData", "cloudwatch:GetMetricStatistics", "logs:GetLogEvents"],
            "Resource": "*"
        }
    ]
}
```

### Timeline

| Date              | Action                            |
| ----------------- | --------------------------------- |
| **Now**           | Start testing Database Insights   |
| **Q1 2025**       | Migrate development environments  |
| **Q2 2025**       | Migrate staging environments      |
| **Q3 2025**       | Migrate production environments   |
| **June 30, 2026** | Performance Insights discontinued |

## Version Upgrade Strategy

Upgrading Aurora engine versions requires careful planning.

### Version Selection Philosophy

This package **does not** force version upgrades. You control when to upgrade:

```typescript
// You choose the version - no forced upgrades
engine: DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_09_0, // Your choice
});
```

### Upgrade Process

#### Step 1: Test in Development

```typescript
// dev-stack.ts
const {cluster} = createAuroraMySqlCluster(this, 'DevCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0, // New version
    }),
    // ... rest of config
});
```

#### Step 2: Validate Application Compatibility

1. Deploy to development
2. Run integration tests
3. Check for deprecated features
4. Monitor for errors

#### Step 3: Staging Upgrade

```typescript
// staging-stack.ts
const {cluster} = createAuroraMySqlCluster(this, 'StagingCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0, // New version
    }),
    // ... rest of config
});
```

#### Step 4: Performance Testing

1. Run load tests
2. Compare metrics with production
3. Verify query performance
4. Check resource utilization

#### Step 5: Production Upgrade

```typescript
// prod-stack.ts
const {cluster} = createAuroraMySqlCluster(this, 'ProdCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0, // New version
    }),
    // ... rest of config
});
```

```bash
# Deploy during maintenance window
cdk deploy ProdStack --require-approval never
```

### Blue/Green Deployment

For zero-downtime upgrades, use blue/green deployment:

```typescript
// Create new cluster with new version
const {cluster: greenCluster} = createAuroraMySqlCluster(this, 'GreenCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0, // New version
    }),
    clusterName: 'green-cluster',
    // ... same config as blue cluster
});

// Steps:
// 1. Deploy green cluster
// 2. Replicate data from blue to green
// 3. Switch application to green
// 4. Verify green is working
// 5. Decommission blue cluster
```

## Zero-Downtime Migration

Migrate to @cdk-constructs/aurora without downtime.

### Strategy 1: In-Place Update

Update your CDK code to use @cdk-constructs/aurora, then deploy:

```bash
# Preview changes
cdk diff

# Changes should show:
# - Updated parameter groups
# - Updated monitoring configuration
# - No cluster replacement

# Deploy
cdk deploy
```

**Note**: CDK will not replace the cluster if you maintain the same logical ID and critical properties.

### Strategy 2: Snapshot and Restore

For major configuration changes:

1. **Create snapshot of existing cluster**:

    ```bash
    aws rds create-db-cluster-snapshot \
        --db-cluster-identifier old-cluster \
        --db-cluster-snapshot-identifier migration-snapshot
    ```

2. **Create new cluster from snapshot**:

    ```typescript
    const {cluster} = createAuroraMySqlCluster(this, 'NewCluster', {
        snapshotIdentifier: 'migration-snapshot',
        // ... new configuration
    });
    ```

3. **Update application connection strings**

4. **Verify new cluster**

5. **Decommission old cluster**

### Strategy 3: Read Replica Promotion

For PostgreSQL, use read replica promotion:

1. **Create read replica in new configuration**
2. **Wait for replication to catch up**
3. **Promote replica to standalone cluster**
4. **Switch application to new cluster**
5. **Decommission old cluster**

## Rollback Plan

Always have a rollback plan:

### Quick Rollback

If migration fails, you can quickly rollback by:

1. **Restore from snapshot**:

    ```bash
    aws rds restore-db-cluster-from-snapshot \
        --db-cluster-identifier rollback-cluster \
        --snapshot-identifier pre-migration-snapshot
    ```

2. **Point application back to old cluster**

### Version Rollback

If you upgraded versions and need to rollback:

1. **Create snapshot of upgraded cluster**
2. **Restore to old version** (if supported)
3. **Or restore from pre-upgrade snapshot**

**Important**: Aurora does not support downgrading engine versions. You can only restore from snapshot.

## Troubleshooting

### Issue: Parameter Group Changes Not Applied

**Solution**: Parameter group changes require a reboot:

```bash
aws rds reboot-db-cluster --db-cluster-identifier my-cluster
```

### Issue: Database Insights Not Working

**Solution**: Ensure logs are exported:

```typescript
{
    cloudwatchLogsExports: ['error', 'slowquery'],
}
```

### Issue: Migration Shows Cluster Replacement

**Cause**: You changed a property that requires replacement.

**Solution**: Check `cdk diff` output. Properties that require replacement include:

- `engine` (engine type, not version)
- `kmsKey` (if changing encryption)
- `vpc`

If you must change these, use snapshot-restore strategy.

### Issue: Performance Degradation After Migration

**Solution**:

1. Check CloudWatch metrics
2. Compare parameter groups (old vs new)
3. Verify instance types match
4. Check for missing indexes
5. Analyze slow queries

## Support

For migration assistance:

- [GitHub Issues](https://github.com/cristianmagana/cdk-constructs-library/issues)
- [AWS Aurora Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [CDK Documentation](https://docs.aws.amazon.com/cdk/)
