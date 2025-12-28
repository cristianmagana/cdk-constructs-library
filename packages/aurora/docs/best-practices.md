# Best Practices

Production-ready patterns and recommendations for using @cdk-constructs/aurora.

## Table of Contents

- [Security](#security)
- [High Availability](#high-availability)
- [Performance](#performance)
- [Monitoring](#monitoring)
- [Cost Optimization](#cost-optimization)
- [Backup and Recovery](#backup-and-recovery)
- [Operational Excellence](#operational-excellence)

## Security

### Use IAM Database Authentication

Enable IAM authentication for secure, credential-free database access:

```typescript
{
    iamAuthentication: true,  // Default is true
}
```

**Benefits:**

- No need to manage database passwords
- Automatic credential rotation via IAM
- Centralized access management
- AWS CloudTrail audit logs

### Store Credentials in Secrets Manager

Never hardcode database credentials. Always use AWS Secrets Manager:

```typescript
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {Credentials} from 'aws-cdk-lib/aws-rds';

const dbSecret = new Secret(this, 'DBSecret', {
    secretName: 'production/database/credentials',
    generateSecretString: {
        secretStringTemplate: JSON.stringify({username: 'admin'}),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
    },
});

// Use in cluster configuration
credentials: Credentials.fromSecret(dbSecret);
```

### Enable Encryption at Rest

Use customer-managed KMS keys for enhanced security:

```typescript
import {Key} from 'aws-cdk-lib/aws-kms';

const kmsKey = new Key(this, 'DatabaseKey', {
    enableKeyRotation: true,
    description: 'KMS key for Aurora cluster encryption',
});

// Use in cluster configuration
{
    storageEncryptionKey: kmsKey,
}
```

### Enable Deletion Protection for Production

Prevent accidental deletion of production databases:

```typescript
{
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,
}
```

### Restrict Network Access

Only allow access from known CIDR blocks:

```typescript
{
    allowedInboundCidrs: [
        '10.0.0.0/8',     // Internal network only
        // Never use '0.0.0.0/0' in production
    ],
}
```

### Use Private Subnets

Always deploy Aurora clusters in private subnets:

```typescript
{
    vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    },
}
```

## High Availability

### Deploy Across Multiple Availability Zones

Ensure your VPC has subnets in at least 2 AZs:

```typescript
const vpc = new Vpc(this, 'VPC', {
    maxAzs: 3, // Use 3 AZs for maximum availability
    natGateways: 3, // One per AZ for HA
});
```

### Use Read Replicas for Read Scaling

Add read replicas to distribute read workload:

```typescript
{
    readersConfig: {
        readerInstanceCount: 2,  // At least 2 for HA
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    },
}
```

**Benefits:**

- Automatic failover if writer fails
- Read workload distribution
- Zero-downtime scaling

### Enable Cluster-Level Enhanced Monitoring

Monitor cluster health in real-time:

```typescript
{
    enableClusterLevelEnhancedMonitoring: true,
    monitoringInterval: Duration.seconds(60),
}
```

## Performance

### Choose the Right Instance Type

**Development/Testing:**

```typescript
// T4G instances for burstable workloads
writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM);
```

**Production (General):**

```typescript
// R6G instances for memory-intensive workloads
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
```

**Production (High Performance):**

```typescript
// R6G.2xlarge or larger for demanding workloads
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE2);
```

### Optimize Connection Pooling

Configure appropriate max_connections based on instance size:

**MySQL:**

```typescript
clusterParameters: {
    parameters: {
        // R6G.large has ~16GB memory
        // Allow ~2000 connections for R6G.large
        'max_connections': '2000',

        // Use most of memory for buffer pool
        'innodb_buffer_pool_size': '{DBInstanceClassMemory*3/4}',
    },
}
```

**PostgreSQL:**

```typescript
clusterParameters: {
    parameters: {
        'max_connections': '2000',
        'shared_buffers': '{DBInstanceClassMemory/32768}',
        'effective_cache_size': '{DBInstanceClassMemory*3/4}',
    },
}
```

### Enable Query Performance Monitoring

Use CloudWatch Database Insights for query analysis:

```typescript
{
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'],  // MySQL
    // cloudwatchLogsExports: ['postgresql'],  // PostgreSQL
}
```

### Tune Slow Query Logging

**MySQL:**

```typescript
clusterParameters: {
    parameters: {
        'slow_query_log': '1',
        'long_query_time': '2',  // Queries slower than 2 seconds
        'log_queries_not_using_indexes': '1',
    },
}
```

**PostgreSQL:**

```typescript
clusterParameters: {
    parameters: {
        'log_min_duration_statement': '2000',  // 2 seconds in milliseconds
        'shared_preload_libraries': 'pg_stat_statements',
    },
}
```

## Monitoring

### Enable CloudWatch Database Insights

Use advanced monitoring for production databases:

```typescript
{
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
    cloudwatchLogsExports: ['error', 'slowquery'],
    enableClusterLevelEnhancedMonitoring: true,
    monitoringInterval: Duration.seconds(60),
}
```

### Set Up CloudWatch Alarms

```typescript
import {Alarm, ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';

// CPU utilization alarm
new Alarm(this, 'HighCPU', {
    metric: cluster.metricCPUUtilization(),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

// Connection count alarm
new Alarm(this, 'HighConnections', {
    metric: cluster.metricDatabaseConnections(),
    threshold: 1800, // 90% of max_connections
    evaluationPeriods: 2,
});
```

### Monitor Slow Queries

Export slow query logs to CloudWatch for analysis:

```typescript
{
    cloudwatchLogsExports: ['slowquery'],  // MySQL
}
```

Then use CloudWatch Insights to analyze:

```
fields @timestamp, @message
| filter @message like /Query_time/
| sort @timestamp desc
| limit 20
```

## Cost Optimization

### Right-Size Instance Types

Start with smaller instances and scale up based on metrics:

```typescript
// Start here for new workloads
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);

// Scale up if needed
// writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE);
```

### Use Graviton (ARM64) Instances

Graviton instances offer better price/performance:

```typescript
// ✅ Good - ARM64 Graviton
InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM);

// ❌ Avoid - x86 instances are more expensive
InstanceType.of(InstanceClass.R5, InstanceSize.LARGE);
InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM);
```

### Use Aurora I/O-Optimized (for high I/O workloads)

For workloads with high I/O, consider Aurora I/O-Optimized pricing:

```typescript
// Configure via AWS Console or CLI
// CDK support coming soon
```

### Scale Read Replicas Based on Load

Add/remove readers based on traffic patterns:

```typescript
// Low traffic
readersConfig: {
    readerInstanceCount: 1,
}

// High traffic
readersConfig: {
    readerInstanceCount: 3,
}
```

### Use Smaller Instances for Non-Production

```typescript
// Development
writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL);

// Staging
writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM);

// Production
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
```

## Backup and Recovery

### Configure Appropriate Backup Retention

```typescript
// Aurora automatically handles backups
// Retention is configured at the cluster level via AWS Console or CLI
// Default: 1 day
// Maximum: 35 days
```

### Use Snapshots for Long-Term Retention

Create manual snapshots for long-term retention:

```typescript
// Snapshots are created via AWS CLI or Console
// Restore using:
{
    snapshotIdentifier: 'my-snapshot-id',
    snapshotCredentials: SnapshotCredentials.fromSecret(dbSecret),
}
```

### Test Your Recovery Process

Regularly test restoring from snapshots:

```typescript
// Create a test cluster from snapshot
const {cluster: testCluster} = createAuroraMySqlCluster(this, 'TestCluster', {
    snapshotIdentifier: 'prod-snapshot-20240101',
    snapshotCredentials: SnapshotCredentials.fromSecret(dbSecret),
    // ... other config
});
```

### Use Point-in-Time Recovery

Aurora supports point-in-time recovery within the backup retention window.

### Retain Production Clusters

Never accidentally delete production data:

```typescript
{
    removalPolicy: RemovalPolicy.RETAIN,  // Production
    // removalPolicy: RemovalPolicy.SNAPSHOT,  // Staging
    // removalPolicy: RemovalPolicy.DESTROY,  // Development
}
```

## Operational Excellence

### Use Infrastructure as Code

Always define infrastructure in CDK (never manual changes):

```typescript
// ✅ Good - Version controlled, repeatable
const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {...});

// ❌ Bad - Manual changes via Console
// (Can't track changes, hard to replicate)
```

### Tag Resources Appropriately

```typescript
import {Tags} from 'aws-cdk-lib';

Tags.of(cluster).add('Environment', 'production');
Tags.of(cluster).add('Team', 'data-platform');
Tags.of(cluster).add('CostCenter', '12345');
```

### Version Control Your Engine

Explicitly specify engine versions (don't use "latest"):

```typescript
// ✅ Good - Explicit version
engine: DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_09_0,
});

// ❌ Bad - Implicit or auto-upgrade
// (Can cause unexpected changes)
```

### Document Parameter Changes

Always document why you changed a parameter:

```typescript
clusterParameters: {
    parameters: {
        // Increased from 1000 to 2000 to handle peak traffic
        // See JIRA-1234 for details
        'max_connections': '2000',
    },
}
```

### Use Separate Clusters for Environments

```typescript
// ✅ Good - Separate clusters
const devCluster = createAuroraMySqlCluster(this, 'DevCluster', {...});
const prodCluster = createAuroraMySqlCluster(this, 'ProdCluster', {...});

// ❌ Bad - Shared cluster across environments
// (Can't test changes safely)
```

### Implement Change Management

1. **Test in Development**: Deploy changes to dev first
2. **Validate in Staging**: Test with production-like load
3. **Deploy to Production**: During maintenance window
4. **Monitor**: Watch metrics closely after deployment

### Plan for Maintenance Windows

```typescript
// Schedule maintenance windows via AWS Console or CLI
// Typically:
// - Development: Anytime
// - Staging: Off-hours
// - Production: Low-traffic periods (e.g., Sunday 2am)
```

## Production Checklist

Before deploying to production, ensure:

- [ ] IAM authentication enabled
- [ ] Credentials stored in Secrets Manager
- [ ] Encryption at rest with KMS
- [ ] Deletion protection enabled
- [ ] Deployed in private subnets
- [ ] Multi-AZ deployment
- [ ] Read replicas configured
- [ ] CloudWatch Database Insights enabled
- [ ] CloudWatch alarms configured
- [ ] Backup retention configured
- [ ] Instance type right-sized
- [ ] Parameter groups optimized
- [ ] Resources tagged
- [ ] Recovery process tested
- [ ] Monitoring dashboard created
- [ ] Team runbooks documented

## Anti-Patterns to Avoid

### ❌ Public Subnets

```typescript
// Never do this
vpcSubnets: {
    subnetType: SubnetType.PUBLIC,
}
```

### ❌ Hardcoded Credentials

```typescript
// Never do this
credentials: Credentials.fromUsername('admin', {
    password: SecretValue.unsafePlainText('password123'),
});
```

### ❌ No Deletion Protection in Production

```typescript
// Risky for production
{
    deletionProtection: false,
}
```

### ❌ Single AZ Deployment

```typescript
// Poor availability
const vpc = new Vpc(this, 'VPC', {
    maxAzs: 1, // Never use 1 AZ in production
});
```

### ❌ Undersized Instances

```typescript
// Too small for production workload
writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO);
```

### ❌ No Monitoring

```typescript
// No visibility into cluster health
{
    // Missing: databaseInsightsMode, cloudwatchLogsExports, etc.
}
```
