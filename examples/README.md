# CDK Constructs Library - Examples

This directory contains example implementations demonstrating how to use the constructs from this library.

## Structure

```
examples/
├── environments.local.ts.example  # Shared local configuration template
└── aurora/                        # Aurora database examples
    ├── config/                    # Aurora configurations
    ├── stacks/                    # Aurora stack implementations
    └── README.md                  # Aurora-specific documentation
```

## Getting Started

### 1. Set Up Local Configuration

For integration testing with real AWS resources, create a local configuration file:

```bash
cd examples
cp environments.local.ts.example environments.local.ts
```

Edit `environments.local.ts` with your actual VPC and subnet IDs:

```typescript
export const LOCAL_CONFIG = {
    vpcId: 'vpc-xxxxxxxxxxxxx', // Your VPC ID
    subnetIds: [
        'subnet-xxxxxxxxxxxxx', // Your private subnet IDs
        'subnet-yyyyyyyyyyyyy',
        'subnet-zzzzzzzzzzzzzzz',
    ],
};
```

**Note**: This file is gitignored and will never be committed to version control.

### 2. Install Dependencies

From the repository root:

```bash
npm install
```

### 3. Build the Packages

```bash
npm run build
```

### 4. Explore Service Examples

Each service has its own directory with:

- **config/** - Environment-specific configurations (dev, prod)
- **stacks/** - CDK stack implementations
- **README.md** - Service-specific documentation

See individual service READMEs for detailed usage instructions:

- [Aurora Database Examples](./aurora/README.md)

## How It Works

The examples use a **config resolver pattern** for managing environment-specific settings:

1. **Base Configurations** - Committed to git with placeholder values (safe for opensource)
2. **Local Overrides** - `environments.local.ts` contains your real AWS resource IDs (gitignored)
3. **Config Resolver** - Each service has a resolver that merges base + local configs
4. **Stack Files** - Import from published packages as real consumers would

### Example Flow

```typescript
// In examples/aurora/stacks/mysql-dev-stack.ts
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora'; // Import from package
import {ConfigResolver} from '../config/config-resolver';

// Resolver automatically merges base config + local overrides
const config = ConfigResolver.getMySqlDevConfig();

createAuroraMySqlCluster(this, 'MyCluster', {
    ...config,
    credentials: Credentials.fromSecret(dbSecret),
});
```

## Benefits of This Pattern

✅ **Opensource-safe** - No sensitive AWS resource IDs in git
✅ **Real consumers** - Examples import from packages like users would
✅ **Integration testing** - Validate actual package usage
✅ **Monorepo-friendly** - Shared config for all services
✅ **Environment separation** - Clear dev vs prod configurations

## Adding New Examples

When adding examples for a new service:

1. Create `examples/<service>/` directory
2. Add config resolver following the Aurora pattern
3. Create service-specific configurations
4. Implement example stacks
5. Document in service README

The `environments.local.ts` at root can be shared across all services.

## Running Examples

Examples can be deployed like any CDK application:

```bash
# From repository root
cdk deploy <StackName>

# Example
cdk deploy AuroraMySqlDevStack
```

Make sure you've:

1. Created `environments.local.ts` with your AWS resource IDs
2. Created required AWS Secrets Manager secrets
3. Built the packages (`npm run build`)

## Contributing

When contributing examples:

- Use placeholder values in committed configs
- Document all required resources (VPCs, secrets, etc.)
- Follow the config resolver pattern
- Add comprehensive inline documentation
- Include both dev and prod configurations
