# @cdk-constructs/cloudfront

CloudFront distribution with S3 origin constructs for AWS CDK.

## Overview

This package provides production-ready CDK constructs for creating CloudFront distributions with S3 origins, including automatic setup of:

- S3 buckets with configurable storage classes and lifecycle policies
- CloudFront distributions with Origin Access Control
- Access logging with automatic log bucket creation
- Optional custom domain support with ACM certificates
- Optional Route 53 DNS integration
- SPA-friendly error response handling

## Installation

```bash
npm install @cdk-constructs/cloudfront --save-exact
```

## Requirements

- Node.js >= 24
- AWS CDK >= 2.225.0
- TypeScript >= 5.4

## Usage

### Basic CloudFront + S3 Distribution

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';

const {distribution, contentBucket, logBucket} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
    },
    route53: {
        enableR53Lookup: false,
    },
});
```

### CloudFront with Custom Domain

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
            config: {
                name: 'intelligent-tiering',
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
        domainNames: ['www.example.com'],
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123...',
    },
    route53: {
        enableR53Lookup: true,
        hostedZoneId: 'Z1234567890ABC',
        domainName: 'example.com',
        aRecordAddress: 'www.example.com',
    },
});
```

### CloudFront with Config Bucket for JSON Files

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
        // Add config bucket for serving JSON config files
        configBucketName: 'my-config-bucket',
        configBucketPath: '/config',
    },
    route53: {
        enableR53Lookup: false,
    },
});

// Now *.json requests will be served from the config bucket
```

## Storage Class Strategies

### Lifecycle Rules

Manually configure transitions to Infrequent Access and Glacier storage classes:

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

Automatically move objects between access tiers based on access patterns:

```typescript
storageClass: {
    strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
    config: {
        name: 'intelligent-tiering-basic',
    },
}
```

Default tiers:

- Frequent Access: Default
- Infrequent Access: 30 days
- Archive Instant Access: 90 days

### Intelligent Tiering (Archive)

Extends basic intelligent tiering with deep archive options:

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

## S3 Bucket Utility

You can also use the S3 bucket creation utility independently:

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {BucketAccessControl} from 'aws-cdk-lib/aws-s3';

const bucket = createS3Bucket(this, {
    bucketName: 'my-bucket',
    versioned: true,
    accessControl: BucketAccessControl.PRIVATE,
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

## Features

### Security

- ✅ SSL enforcement on all S3 buckets
- ✅ Block all public access by default
- ✅ S3 managed or KMS encryption
- ✅ Origin Access Control for CloudFront to S3
- ✅ HTTPS redirect for all viewer requests

### Cost Optimization

- ✅ Configurable storage class strategies
- ✅ Automatic lifecycle transitions
- ✅ Intelligent tiering support
- ✅ Price class configuration (defaults to PRICE_CLASS_100)

### Logging & Monitoring

- ✅ CloudFront access logging enabled by default
- ✅ Automatic log bucket creation with lifecycle policies
- ✅ Versioning support for content buckets

### Developer Experience

- ✅ SPA-friendly error responses (404/403 → index.html)
- ✅ TypeScript type safety
- ✅ Comprehensive TSDoc documentation
- ✅ Minimal required configuration

## API Reference

### Types

- `CloudFrontS3Props` - Main configuration for CloudFront + S3
- `CloudFrontProps` - CloudFront distribution configuration
- `Route53Props` - Route 53 DNS configuration
- `BucketProps` - S3 bucket configuration
- `StorageClassStrategy` - Enum for storage class strategies
- `CloudFrontS3Resources` - Resources returned by createCloudFrontS3

### Functions

- `createCloudFrontS3(scope, props)` - Create CloudFront distribution with S3 origin
- `createS3Bucket(scope, props)` - Create S3 bucket with lifecycle policies

## License

Apache-2.0

## Contributing

See the main [repository README](../../README.md) for contribution guidelines.
