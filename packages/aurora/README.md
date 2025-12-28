# @cdk-constructs/aurora

Production-ready Aurora PostgreSQL and MySQL database cluster constructs for AWS CDK.

## Overview

Create production-grade Aurora database clusters with best practices built-in, CloudWatch Database Insights monitoring, and flexible version control.

### Key Features

✅ **CloudWatch Database Insights** - Advanced monitoring (replaces deprecated Performance Insights)
✅ **No Forced Upgrades** - Choose any Aurora version, upgrade on your timeline
✅ **Secure by Default** - IAM auth, encryption, private subnets, Secrets Manager integration
✅ **High Availability** - Multi-AZ deployment, read replicas, automatic failover
✅ **Production-Ready** - Optimized parameters, monitoring, backup strategies

### Important: Performance Insights Deprecation

⚠️ AWS Performance Insights will be **deprecated June 30, 2026**. This package uses CloudWatch Database Insights for enhanced monitoring with fleet-level visibility, lock analysis, and application integration.

## Documentation

📖 **[Complete Documentation →](./docs/README.md)**

- **[Getting Started](./docs/getting-started.md)** - Installation, first cluster, complete examples
- **[Configuration Reference](./docs/configuration-reference.md)** - All configuration options
- **[Utilities](./docs/utilities.md)** - VPC lookup, KMS creation, helper functions
- **[Best Practices](./docs/best-practices.md)** - Security, performance, monitoring, cost optimization
- **[Examples](./docs/examples.md)** - Real-world deployment scenarios
- **[Migration Guide](./docs/migration-guide.md)** - Migrate from other solutions

## Quick Start

### Installation

```bash
npm install @cdk-constructs/aurora
```

### Basic Usage

```typescript
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, Credentials, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';

const {cluster} = createAuroraMySqlCluster(this, 'Database', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'my-cluster',
    vpcId: 'vpc-xxxxxxxxxxxxx',
    databaseName: 'mydb',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,

    // Optional: Specify specific subnets by ID
    subnetIds: ['subnet-abc123', 'subnet-def456', 'subnet-ghi789'],

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

**→ [View complete getting started guide](./docs/getting-started.md)**

## Common Use Cases

### Development Environment

```typescript
// Minimal cost, basic monitoring
writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
databaseInsightsMode: DatabaseInsightsMode.STANDARD,
```

**→ [Development cluster example](./docs/examples.md#basic-development-cluster)**

### Production Environment

```typescript
// High availability, advanced monitoring, read replicas
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
readersConfig: {readerInstanceCount: 2},
databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
deletionProtection: true,
```

**→ [Production cluster example](./docs/examples.md#production-cluster-with-read-replicas)**

### High-Performance Analytics

```typescript
// Large instances, multiple readers, optimized parameters
writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE4),
readersConfig: {readerInstanceCount: 3},
// Custom parameter tuning
```

**→ [High-performance example](./docs/examples.md#high-performance-cluster)**

## Features

| Feature                          | Description                                        | Documentation                                                                 |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| **CloudWatch Database Insights** | Advanced monitoring replacing Performance Insights | [Configuration →](./docs/configuration-reference.md#monitoring-configuration) |
| **Flexible Versions**            | Choose any Aurora version, no forced upgrades      | [Version Management →](./docs/best-practices.md#version-upgrade-strategy)     |
| **Read Replicas**                | Scale read operations with auto-failover           | [Configuration →](./docs/configuration-reference.md#readersconfig)            |
| **Security**                     | IAM auth, encryption, Secrets Manager              | [Best Practices →](./docs/best-practices.md#security)                         |
| **S3 Integration**               | Import/export data to S3                           | [Examples →](./docs/examples.md#s3-data-importexport)                         |
| **Snapshot Restore**             | Create from existing snapshots                     | [Examples →](./docs/examples.md#restore-from-snapshot)                        |

## Version Control

**You control when to upgrade** - no forced version changes:

```typescript
// Use any supported version
engine: DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_09_0, // Your choice
});
```

**→ [Version upgrade strategy](./docs/migration-guide.md#version-upgrade-strategy)**

## Learn More

### 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Installation, prerequisites, first cluster
- **[Configuration Reference](./docs/configuration-reference.md)** - Complete API reference
- **[Utilities](./docs/utilities.md)** - VPC lookup, KMS creation, helper functions
- **[Best Practices](./docs/best-practices.md)** - Security, performance, monitoring
- **[Examples](./docs/examples.md)** - 8+ real-world scenarios
- **[Migration Guide](./docs/migration-guide.md)** - Migrate from other solutions

### 🔧 Common Tasks

- [Lookup VPC by ID](./docs/utilities.md#getvpc)
- [Create customer-managed KMS key](./docs/utilities.md#kms-key-utilities)
- [Enable Database Insights](./docs/configuration-reference.md#databaseinsightsmode)
- [Add read replicas](./docs/configuration-reference.md#readersconfig)
- [Configure monitoring](./docs/best-practices.md#monitoring)
- [Optimize performance](./docs/best-practices.md#performance)
- [Set up backups](./docs/best-practices.md#backup-and-recovery)

### 🚀 Deployment Scenarios

- [Development setup](./docs/examples.md#basic-development-cluster)
- [Production with HA](./docs/examples.md#production-cluster-with-read-replicas)
- [Multi-region](./docs/examples.md#multi-region-setup)
- [Complete application stack](./docs/examples.md#complete-application-stack)

## Support

- 📖 **[Full Documentation](./docs/README.md)**
- 🐛 **[Report Issues](https://github.com/cristianmagana/cdk-constructs-library/issues)**
- 💡 **[Request Features](https://github.com/cristianmagana/cdk-constructs-library/issues/new)**
- 📝 **[Contributing Guide](../../README.md#contributing)**

## License

See [LICENSE](../../LICENSE) for details.

---

**Ready to get started?** → **[Getting Started Guide](./docs/getting-started.md)**
