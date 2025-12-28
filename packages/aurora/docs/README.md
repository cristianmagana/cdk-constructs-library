# @cdk-constructs/aurora Documentation

Comprehensive documentation for the Aurora database constructs package.

## Quick Links

- **[Getting Started](./getting-started.md)** - Get up and running quickly
- **[Configuration Reference](./configuration-reference.md)** - Complete configuration options
- **[Best Practices](./best-practices.md)** - Production-ready patterns
- **[Examples](./examples.md)** - Real-world usage examples
- **[Migration Guide](./migration-guide.md)** - Migrate from other solutions

## What is @cdk-constructs/aurora?

@cdk-constructs/aurora is a production-ready AWS CDK construct library for creating Aurora PostgreSQL and MySQL database clusters with best practices built-in.

## Key Features

### 🔒 Security First

- IAM database authentication by default
- Encryption at rest with KMS support
- Secure credential management via Secrets Manager
- Private subnet deployment
- Configurable network access controls

### 📊 Advanced Monitoring

- **CloudWatch Database Insights** (replaces deprecated Performance Insights)
- Slow query logging
- Enhanced monitoring
- Fleet-level monitoring capabilities
- Lock analysis and query performance insights

### 🚀 Flexible and Non-Opinionated

- **No forced engine version upgrades** - you control when to upgrade
- Choose any Aurora MySQL or PostgreSQL version
- Upgrade on your own timeline
- Test upgrades in non-production first

### ⚡ Production-Ready

- High availability across multiple AZs
- Automatic failover with read replicas
- Optimized parameter groups
- S3 import/export support
- Snapshot and restore capabilities

### 💰 Cost-Effective

- ARM64 Graviton instance support
- Right-sized instance recommendations
- Environment-specific configurations

## Important: Performance Insights Deprecation

Starting **June 30, 2026**, AWS Performance Insights will be deprecated. This package uses **CloudWatch Database Insights** instead, providing:

- Fleet-level monitoring across all databases
- Integration with application performance monitoring
- Advanced lock analysis
- Enhanced query performance insights
- Longer data retention

[Learn more about Database Insights →](./configuration-reference.md#monitoring-configuration)

## Documentation Structure

### Getting Started

New to @cdk-constructs/aurora? Start here:

- **[Installation and Setup](./getting-started.md#installation)**
- **[Your First Cluster](./getting-started.md#your-first-aurora-cluster)**
- **[Basic Examples](./getting-started.md#complete-example)**

### Configuration

Detailed reference for all configuration options:

- **[Required Properties](./configuration-reference.md#required-properties)**
- **[Monitoring Configuration](./configuration-reference.md#monitoring-configuration)**
- **[Security Configuration](./configuration-reference.md#security-configuration)**
- **[MySQL-Specific](./configuration-reference.md#mysql-specific-configuration)**
- **[PostgreSQL-Specific](./configuration-reference.md#postgresql-specific-configuration)**

### Best Practices

Production-ready patterns and recommendations:

- **[Security Best Practices](./best-practices.md#security)**
- **[High Availability](./best-practices.md#high-availability)**
- **[Performance Optimization](./best-practices.md#performance)**
- **[Monitoring Strategy](./best-practices.md#monitoring)**
- **[Cost Optimization](./best-practices.md#cost-optimization)**
- **[Production Checklist](./best-practices.md#production-checklist)**

### Examples

Real-world implementation examples:

- **[Development Cluster](./examples.md#basic-development-cluster)**
- **[Production with Read Replicas](./examples.md#production-cluster-with-read-replicas)**
- **[High-Performance Setup](./examples.md#high-performance-cluster)**
- **[S3 Integration](./examples.md#s3-data-importexport)**
- **[Complete Application Stack](./examples.md#complete-application-stack)**

### Migration

Migrate from other solutions:

- **[From AWS CDK L2 Constructs](./migration-guide.md#from-aws-cdk-l2-constructs)**
- **[From Custom Solutions](./migration-guide.md#from-custom-aurora-solutions)**
- **[Performance Insights to Database Insights](./migration-guide.md#from-performance-insights-to-database-insights)**
- **[Version Upgrade Strategy](./migration-guide.md#version-upgrade-strategy)**

## Quick Start

```bash
# Install
npm install @cdk-constructs/aurora

# Create a cluster
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';

const {cluster} = createAuroraMySqlCluster(this, 'MyCluster', {
    engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_09_0,
    }),
    clusterName: 'my-cluster',
    vpc: myVpc,
    databaseName: 'mydb',
    credentials: Credentials.fromSecret(dbSecret),
    writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
    databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
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

[View complete getting started guide →](./getting-started.md)

## Common Use Cases

### Development Database

- Minimal cost burstable instances
- No read replicas
- Basic monitoring
- [View example →](./examples.md#basic-development-cluster)

### Production Database

- High-availability across multiple AZs
- Read replicas for scaling
- Advanced monitoring with Database Insights
- Enhanced security
- [View example →](./examples.md#production-cluster-with-read-replicas)

### High-Performance Analytics

- Large memory-optimized instances
- Multiple read replicas
- Optimized parameter groups
- Maximum monitoring
- [View example →](./examples.md#high-performance-cluster)

### Disaster Recovery

- Multi-region deployment
- Automated backups
- Snapshot management
- [View example →](./examples.md#multi-region-setup)

## Comparison with Other Solutions

### vs. Native CDK DatabaseCluster

| Feature               | Native CDK             | @cdk-constructs/aurora     |
| --------------------- | ---------------------- | -------------------------- |
| **Setup Complexity**  | High - many properties | Low - structured config    |
| **Parameter Groups**  | Optional               | Required (best practice)   |
| **Monitoring**        | Manual setup           | Database Insights built-in |
| **Security Defaults** | Minimal                | Secure by default          |
| **Documentation**     | Generic                | Aurora-specific            |
| **Examples**          | Limited                | Comprehensive              |

### vs. Custom Solutions

| Feature            | Custom              | @cdk-constructs/aurora |
| ------------------ | ------------------- | ---------------------- |
| **Maintenance**    | You maintain        | Community maintained   |
| **Updates**        | Manual              | Package updates        |
| **Testing**        | Your responsibility | Tested                 |
| **Documentation**  | You document        | Documented             |
| **Best Practices** | Implement yourself  | Built-in               |

## Version Support

### Aurora MySQL

- 3.09.x (Latest)
- 3.08.x
- 3.07.x
- 3.06.x
- 3.05.x
- 3.04.x

You choose the version - **no forced upgrades**.

### Aurora PostgreSQL

- 16.x (Latest)
- 15.x
- 14.x
- 13.x

You choose the version - **no forced upgrades**.

## Support and Resources

### Getting Help

- **[GitHub Issues](https://github.com/cristianmagana/cdk-constructs-library/issues)** - Bug reports and feature requests
- **[AWS Aurora Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)** - Official Aurora docs
- **[CDK Documentation](https://docs.aws.amazon.com/cdk/)** - AWS CDK reference

### Additional Resources

- **[AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)** - AWS best practices
- **[Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)** - Aurora-specific guidance
- **[CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html)** - Monitoring guide

## Contributing

We welcome contributions! Please see the [Contributing Guide](../../../README.md#contributing) for details.

## License

See [LICENSE](../../../LICENSE) for details.

---

**Ready to get started?** → [Getting Started Guide](./getting-started.md)

**Need help migrating?** → [Migration Guide](./migration-guide.md)

**Looking for examples?** → [Examples](./examples.md)
