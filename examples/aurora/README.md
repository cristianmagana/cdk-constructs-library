# Aurora Examples

This directory contains example configurations and stacks demonstrating how to use the Aurora constructs.

## Structure

```
examples/
├── config/                           # Environment-specific configurations
│   ├── aurora-mysql-dev.ts           # MySQL dev config (placeholders)
│   ├── aurora-mysql-prod.ts          # MySQL prod config (placeholders)
│   ├── aurora-postgres-dev.ts        # PostgreSQL dev config (placeholders)
│   ├── aurora-postgres-prod.ts       # PostgreSQL prod config (placeholders)
│   ├── config-resolver.ts            # Configuration resolver with override logic
│   └── environments.local.ts.example # Example local overrides (copy to .local.ts)
└── stacks/                           # Example CDK stacks
    ├── aurora-mysql-dev-stack.ts
    ├── aurora-mysql-prod-stack.ts
    ├── aurora-postgres-dev-stack.ts
    └── aurora-postgres-prod-stack.ts
```

## Configuration Pattern

The examples use a layered configuration pattern with local overrides:

1. **Base configs** (`config/aurora-*.ts`) - Opensource-safe configurations with placeholder VPC/subnet IDs
2. **Config resolver** (`config-resolver.ts`) - Merges base configs with local overrides
3. **Local overrides** (`environments.local.ts`) - Your actual AWS resource IDs (gitignored)
4. **Stack files** (`stacks/*.ts`) - Use ConfigResolver to get merged configuration

This pattern allows you to:

- Commit examples safely to opensource without exposing AWS resources
- Override VPC/subnet IDs locally for integration testing
- Keep sensitive information separate from versioned code
- Easily compare dev vs prod settings

## Before Using These Examples

### 1. Create Local Configuration (For Integration Testing)

The base configurations use placeholder values that are safe for opensource. To test locally with real AWS resources:

**Step 1: Copy the example file**

```bash
cd examples
cp environments.local.ts.example environments.local.ts
```

**Step 2: Find your AWS resources**

```bash
# List VPCs
aws ec2 describe-vpcs \
  --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# List subnets for a VPC
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=YOUR_VPC_ID" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

**Step 3: Update `environments.local.ts`**

```typescript
export const LOCAL_CONFIG = {
    vpcId: 'vpc-0b955484293edcc37', // Your actual VPC ID
    subnetIds: [
        'subnet-04b07247c8bad3f7d', // Your actual private subnet IDs
        'subnet-0c073235ba0230aff',
        'subnet-05b0654aaa2a40946',
    ],
};
```

**Note**: The `*.local.ts` file is gitignored and will never be committed.

### 2. Create Database Credentials

Create secrets in AWS Secrets Manager for your database credentials:

```bash
# Development
aws secretsmanager create-secret \
  --name aurora-mysql-dev-credentials \
  --secret-string '{"username":"admin","password":"YOUR_DEV_PASSWORD"}'

# Production (use a strong password!)
aws secretsmanager create-secret \
  --name aurora-mysql-prod-credentials \
  --secret-string '{"username":"admin","password":"YOUR_STRONG_PROD_PASSWORD"}'
```

### 3. Review Security Settings

Before deploying to production, review:

- **Deletion protection** - Enabled for prod, prevents accidental deletion
- **Removal policy** - RETAIN for prod, DESTROY for dev
- **KMS encryption** - Customer-managed keys for prod
- **Monitoring** - Advanced Database Insights for prod
- **Network access** - Configure `allowedInboundCidrs` if needed

## How the Config Resolver Works

The `ConfigResolver` class automatically merges base configurations with local overrides:

```typescript
// In your stack
import {ConfigResolver} from '../config/config-resolver';

// Get configuration (automatically merges base + local if available)
const config = ConfigResolver.getMySqlDevConfig();

// Create cluster with resolved configuration
createAuroraMySqlCluster(this, 'AuroraMySqlDev', {
    ...config,
    credentials: Credentials.fromSecret(dbSecret),
});
```

**Without `environments.local.ts`**: Uses placeholder VPC/subnet IDs from base config (will fail to deploy but safe for opensource)

**With `environments.local.ts`**: Uses your actual VPC/subnet IDs (ready for deployment)

## Usage Example

```typescript
import {App} from 'aws-cdk-lib';
import {AuroraMySqlDevStack} from './examples/stacks/aurora-mysql-dev-stack';

const app = new App();

new AuroraMySqlDevStack(app, 'AuroraMySqlDevStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

app.synth();
```

## Deploying

```bash
# Deploy development environment
cdk deploy AuroraMySqlDevStack

# Deploy production environment (requires confirmation due to security settings)
cdk deploy AuroraMySqlProdStack
```

## Differences Between Dev and Prod

| Feature             | Development | Production         |
| ------------------- | ----------- | ------------------ |
| Instance Type       | T4G.MEDIUM  | R6G.LARGE          |
| Read Replicas       | 0           | 2                  |
| Database Insights   | STANDARD    | ADVANCED           |
| Enhanced Monitoring | Disabled    | Enabled            |
| KMS Encryption      | AWS-managed | Customer-managed   |
| Deletion Protection | Disabled    | Enabled            |
| Removal Policy      | DESTROY     | RETAIN             |
| CloudWatch Logs     | Error only  | Error + Slow Query |

## Customization

You can override any config value when creating the stack:

```typescript
const {cluster} = createAuroraMySqlCluster(this, 'MyCluster', {
    ...MYSQL_DEV_CONFIG,
    credentials: Credentials.fromSecret(dbSecret),
    // Override specific values
    clusterName: 'my-custom-cluster-name',
    writerInstanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.LARGE),
});
```

## Additional Resources

- [Aurora MySQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Aurora PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.BestPractices.html)
- [CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html)
