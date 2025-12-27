# @cdk-constructs/aws

AWS account, region, and environment enumerations for CDK Constructs Library.

## Overview

This package provides standardized enums for AWS accounts, regions, and environments, making it easier to manage multi-account and multi-region deployments with consistent naming and type safety.

## Installation

```bash
npm install @cdk-constructs/aws --save-exact
```

## Usage

### Example Account IDs (Public Package)

The published package includes example account IDs for demonstration purposes:

```typescript
import {Account, Environment, Region} from '@cdk-constructs/aws';

const stack = new Stack(app, 'MyStack', {
    env: {
        account: Account.PROD, // '333333333333' (example)
        region: Region.US_EAST_1,
    },
});
```

### Using Your Own Account IDs (Recommended)

For your actual AWS deployments, create a local configuration file:

**Step 1:** Create `packages/aws/src/accounts.local.ts`

```typescript
export enum AccountLocal {
    DEV = 'your-dev-account-id',
    STAGING = 'your-staging-account-id',
    PROD = 'your-prod-account-id',
}
```

**Step 2:** Import from your local file

```typescript
import {AccountLocal} from '@cdk-constructs/aws/dist/src/accounts.local';
import {Environment, Region} from '@cdk-constructs/aws';

const stack = new Stack(app, 'MyStack', {
    env: {
        account: AccountLocal.PROD,
        region: Region.US_EAST_1,
    },
});
```

**Important:** The `accounts.local.ts` file is gitignored and will never be published or committed. This keeps your actual AWS account IDs private while allowing you to publish the package publicly with example IDs.

### Region Enum

```typescript
import {Region} from '@cdk-constructs/aws';

const region = Region.US_EAST_1;
```

### Environment Enum

```typescript
import {Environment} from '@cdk-constructs/aws';

const env = Environment.PROD;
```

## Enums

### Account (Example IDs)

- `DEV` - Development account ID (example: `111111111111`)
- `STAGING` - Staging account ID (example: `222222222222`)
- `PROD` - Production account ID (example: `333333333333`)

### Region

- `US_EAST_1` - US East (N. Virginia)
- `US_EAST_2` - US East (Ohio)
- `US_WEST_1` - US West (N. California)
- `US_WEST_2` - US West (Oregon)

### Environment

- `BUILD` - Build/CI environment
- `DEV` - Development environment
- `STAGING` - Staging environment
- `PROD` - Production environment

## Requirements

- Node.js >= 24.x
- AWS CDK >= 2.225.0

## License

[Add your license here]
