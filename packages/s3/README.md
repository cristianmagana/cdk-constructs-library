# @cdk-constructs/s3

S3 bucket constructs with lifecycle policies and storage class strategies for AWS CDK.

## Overview

This package provides production-ready CDK constructs for creating S3 buckets with:

- Configurable storage class strategies (Lifecycle Rules, Intelligent Tiering)
- Automatic lifecycle transitions to optimize costs
- Built-in security best practices (SSL enforcement, block public access)
- Optional KMS encryption
- Optional versioning and CORS configuration
- Custom policy statements support

## Installation

```bash
npm install @cdk-constructs/s3 --save-exact
```

## Requirements

- Node.js >= 24
- AWS CDK >= 2.225.0
- TypeScript >= 5.4

## Usage

### Basic S3 Bucket with Lifecycle Rules

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';

const bucket = createS3Bucket(this, {
    bucketName: 'my-data-bucket',
    versioned: true,
    removalPolicy: RemovalPolicy.DESTROY,
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
});
```

### S3 Bucket with Intelligent Tiering (Basic)

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';

const bucket = createS3Bucket(this, {
    bucketName: 'my-intelligent-bucket',
    versioned: true,
    storageClass: {
        strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
        config: {
            name: 'intelligent-tiering-basic',
        },
    },
});
```

**Default intelligent tiering tiers:**

- Frequent Access: Default
- Infrequent Access: 30 days
- Archive Instant Access: 90 days

### S3 Bucket with Intelligent Tiering (Archive)

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {Duration} from 'aws-cdk-lib';

const bucket = createS3Bucket(this, {
    bucketName: 'my-archive-bucket',
    versioned: true,
    storageClass: {
        strategy: StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE,
        config: {
            name: 'intelligent-tiering-archive',
            archiveAccessTierTime: Duration.days(90),
            deepArchiveAccessTierTime: Duration.days(180),
        },
    },
});
```

### S3 Bucket with KMS Encryption

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {Duration} from 'aws-cdk-lib';

const bucket = createS3Bucket(this, {
    bucketName: 'my-encrypted-bucket',
    versioned: true,
    bucketKmsEncryptionKey: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
});
```

### S3 Bucket with Custom Policy Statements

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {Duration} from 'aws-cdk-lib';
import {PolicyStatement, Effect, AnyPrincipal} from 'aws-cdk-lib/aws-iam';

const bucket = createS3Bucket(this, {
    bucketName: 'my-policy-bucket',
    versioned: true,
    policyStatements: [
        new PolicyStatement({
            effect: Effect.DENY,
            principals: [new AnyPrincipal()],
            actions: ['s3:*'],
            resources: ['arn:aws:s3:::my-policy-bucket/*'],
            conditions: {
                Bool: {
                    'aws:SecureTransport': 'false',
                },
            },
        }),
    ],
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
});
```

### S3 Bucket with CORS Configuration

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {Duration} from 'aws-cdk-lib';
import {HttpMethods} from 'aws-cdk-lib/aws-s3';

const bucket = createS3Bucket(this, {
    bucketName: 'my-cors-bucket',
    versioned: true,
    cors: {
        allowedOrigins: ['https://example.com'],
        allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
        allowedHeaders: ['*'],
        maxAge: 3000,
    },
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
});
```

## Storage Class Strategies

### Lifecycle Rules (Manual)

Manually configure transitions to Infrequent Access and Glacier storage classes based on fixed time periods.

**Use when:**

- You have predictable access patterns
- You want explicit control over storage transitions
- Cost optimization is important

**Configuration:**

```typescript
storageClass: {
    strategy: StorageClassStrategy.LIFECYCLE_RULE,
    config: {
        infrequentAccessTransitionAfter: Duration.days(30),
        glacierTransitionAfter: Duration.days(90),
    },
}
```

### Intelligent Tiering (Basic)

Automatically moves objects between access tiers based on access patterns without performance impact or operational overhead.

**Use when:**

- Access patterns are unknown or changing
- You want automatic cost optimization
- Objects are larger than 128 KB and stored for at least 30 days

**Configuration:**

```typescript
storageClass: {
    strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
    config: {
        name: 'intelligent-tiering-basic',
    },
}
```

**Automatic tiers:**

- Frequent Access: Default tier
- Infrequent Access: After 30 days without access
- Archive Instant Access: After 90 days without access

### Intelligent Tiering (Archive)

Extends basic intelligent tiering with optional Archive Access and Deep Archive Access tiers for long-term storage.

**Use when:**

- You need deep archive capabilities
- Objects may not be accessed for months or years
- Maximum cost optimization is desired

**Configuration:**

```typescript
storageClass: {
    strategy: StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE,
    config: {
        name: 'intelligent-tiering-archive',
        archiveAccessTierTime: Duration.days(90),
        deepArchiveAccessTierTime: Duration.days(180),
    },
}
```

**Automatic tiers:**

- Frequent Access: Default tier
- Infrequent Access: After 30 days
- Archive Instant Access: After 90 days
- Archive Access: Configurable (e.g., 90 days)
- Deep Archive Access: Configurable (e.g., 180 days)

## Features

### Security

- ✅ SSL enforcement on all buckets
- ✅ Block all public access by default
- ✅ S3 managed or KMS encryption
- ✅ Private access control by default

### Cost Optimization

- ✅ Three storage class strategies
- ✅ Automatic lifecycle transitions
- ✅ Intelligent tiering support (basic and archive)
- ✅ Configurable transition periods

### Flexibility

- ✅ Optional versioning
- ✅ Optional CORS configuration
- ✅ Custom policy statements
- ✅ Configurable removal policies
- ✅ Optional KMS encryption keys

### Developer Experience

- ✅ TypeScript type safety
- ✅ Comprehensive TSDoc documentation
- ✅ Minimal required configuration
- ✅ Factory function pattern (no construct IDs needed)

## API Reference

### Types

- `BucketProps` - Configuration properties for S3 bucket creation
- `StorageClassStrategy` - Enum for storage class strategies
- `LifecycleRuleConfig` - Lifecycle rule configuration
- `IntelligentTieringBasicConfig` - Basic intelligent tiering configuration
- `IntelligentTieringArchiveConfig` - Archive intelligent tiering configuration
- `StorageClassOverride` - Storage class strategy configuration

### Functions

- `createS3Bucket(scope, props)` - Create S3 bucket with lifecycle policies

## Cost Considerations

### Lifecycle Rules

- **Storage costs**: Reduced as objects transition to cheaper storage classes
- **Transition costs**: Small per-object fee when transitioning between classes
- **Retrieval costs**: Higher for Glacier (consider access patterns)

### Intelligent Tiering

- **Monitoring fee**: Small monthly fee per object (only for objects > 128 KB)
- **No transition fees**: Automatic transitions have no additional cost
- **No retrieval fees**: Instant access tiers have no retrieval fees
- **Archive tiers**: Archive Access and Deep Archive Access have retrieval fees

**Recommendation**: Use Intelligent Tiering for unknown access patterns, Lifecycle Rules for predictable patterns.

## Best Practices

1. **Enable versioning** for important data to protect against accidental deletion
2. **Use KMS encryption** for sensitive data
3. **Choose the right storage strategy** based on access patterns:
    - Lifecycle Rules: Predictable access patterns
    - Intelligent Tiering: Unknown or changing access patterns
4. **Set appropriate RemovalPolicy**: Use `RETAIN` for production buckets
5. **Enable SSL enforcement** (automatically enabled by default)
6. **Block public access** (automatically enabled by default)

## License

Apache-2.0

## Contributing

See the main [repository README](../../README.md) for contribution guidelines.
