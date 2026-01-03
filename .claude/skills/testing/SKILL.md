# Testing Requirements

## Overview

This project uses a **two-tier testing approach**:

1. **Unit Tests**: In `packages/{package}/test/` for fast, isolated testing
2. **Integration Tests**: In `examples/{package}/` as real, deployable CDK stacks

This ensures constructs work correctly in isolation AND in real AWS environments.

## Testing Strategy

### 1. Unit Tests (Required)

Unit tests are located in `packages/{package}/test/` and validate:

- Construct creation with valid inputs
- Error handling for invalid inputs
- CloudFormation resource properties
- Resource counts and relationships
- Default values and optional parameters

**Structure:**

```
packages/{package}/test/
├── {package}.test.ts              # Main unit tests
└── {construct-name}.test.ts       # Construct-specific tests
```

**Example Unit Test:**

```typescript
import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {createMyResource} from '../src';

describe('MyResource', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {account: '123456789012', region: 'us-east-1'},
        });
    });

    test('creates resource with required properties', () => {
        const {resource} = createMyResource(stack, {
            resourceName: 'test-resource',
            // ... required props
        });

        const template = Template.fromStack(stack);

        // Verify resource exists
        template.resourceCountIs('AWS::Service::Resource', 1);

        // Verify properties
        template.hasResourceProperties('AWS::Service::Resource', {
            ResourceName: 'test-resource',
        });
    });

    test('creates supporting resources automatically', () => {
        createMyResource(stack, {
            resourceName: 'test-resource',
        });

        const template = Template.fromStack(stack);

        // Verify IAM role created
        template.resourceCountIs('AWS::IAM::Role', 1);

        // Verify log group created
        template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('applies default values correctly', () => {
        createMyResource(stack, {
            resourceName: 'test-resource',
            // Don't provide optional props
        });

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Service::Resource', {
            DeletionProtection: false, // Default value
            RemovalPolicy: 'Destroy', // Default value
        });
    });

    test('throws error for invalid configuration', () => {
        expect(() => {
            createMyResource(stack, {
                resourceName: 'test-resource',
                invalidProp: 'should fail',
            } as any);
        }).toThrow('Invalid configuration');
    });
});
```

### 2. Integration Tests (Examples)

Examples are located in `examples/{package}/` and serve multiple purposes:

- **Documentation**: Show real-world usage patterns
- **Integration Testing**: Can be deployed to AWS for validation
- **Validation**: Ensures constructs synthesize correctly
- **Development**: Quick feedback during construct development

**Structure:**

Each package should have examples following this structure:

```
examples/{package}/
├── config/
│   ├── {package}-dev.ts           # Development configuration
│   ├── {package}-prod.ts          # Production configuration
│   └── config-resolver.ts         # Configuration resolver with local overrides
└── stacks/
    ├── {package}-dev-stack.ts     # Development stack
    └── {package}-prod-stack.ts    # Production stack
```

## Creating Examples

### Step 1: Create Configuration Files

**Development Configuration** (`config/{package}-dev.ts`):

```typescript
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {MyResourceProps} from '@cdk-constructs/{package}';

/**
 * Development environment configuration.
 *
 * @remarks
 * This configuration creates a dev resource with:
 * - Cost-optimized settings
 * - Destroy removal policy for easy cleanup
 * - Minimal resources for development
 */
export const {PACKAGE}_DEV_CONFIG: MyResourceProps = {
    resourceName: 'my-resource-dev',
    // Dev-appropriate settings
    deletionProtection: false,
    removalPolicy: RemovalPolicy.DESTROY,
    // ... other config
};
```

**Production Configuration** (`config/{package}-prod.ts`):

```typescript
import {RemovalPolicy} from 'aws-cdk-lib';
import {MyResourceProps} from '@cdk-constructs/{package}';

/**
 * Production environment configuration.
 *
 * @remarks
 * This configuration creates a production resource with:
 * - High availability
 * - Retain removal policy
 * - Production-grade settings
 */
export const {PACKAGE}_PROD_CONFIG: MyResourceProps = {
    resourceName: 'my-resource-prod',
    // Production settings
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,
    // ... other config
};
```

**Configuration Resolver** (`config/config-resolver.ts`):

```typescript
import {MyResourceProps} from '@cdk-constructs/{package}';
import {{PACKAGE}_DEV_CONFIG} from './{package}-dev';
import {{PACKAGE}_PROD_CONFIG} from './{package}-prod';

/**
 * Local configuration interface for environment overrides.
 */
export interface LocalConfig {
    // Add properties that can be overridden locally
    vpcId?: string;
    subnetIds?: string[];
}

/**
 * Configuration resolver for examples.
 *
 * @remarks
 * This resolver implements a layered configuration approach:
 * 1. Base configuration (with placeholders) - Always loaded
 * 2. Local overrides (from environments.local.ts) - Optional, gitignored
 *
 * This allows:
 * - Opensource examples with safe placeholder values
 * - Local integration testing with real AWS resources
 * - No risk of committing sensitive resource IDs
 */
export class ConfigResolver {
    private static localConfig: LocalConfig | undefined;
    private static localConfigLoaded = false;

    private static loadLocalConfig(): LocalConfig | undefined {
        if (!this.localConfigLoaded) {
            try {
                const {LOCAL_{PACKAGE}_CONFIG} = require('../../environments.local');
                this.localConfig = LOCAL_{PACKAGE}_CONFIG;
            } catch {
                this.localConfig = undefined;
            }
            this.localConfigLoaded = true;
        }
        return this.localConfig;
    }

    private static resolve<T extends LocalConfig>(baseConfig: T): T {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {...baseConfig, ...localConfig};
        }
        return baseConfig;
    }

    public static getDevConfig(): MyResourceProps {
        return this.resolve({PACKAGE}_DEV_CONFIG);
    }

    public static getProdConfig(): MyResourceProps {
        return this.resolve({PACKAGE}_PROD_CONFIG);
    }

    public static hasLocalConfig(): boolean {
        return this.loadLocalConfig() !== undefined;
    }
}
```

### Step 2: Create Stack Files

**Development Stack** (`stacks/{package}-dev-stack.ts`):

```typescript
import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createMyResource} from '@cdk-constructs/{package}';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying {Resource} in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the {Resource} construct with:
 * - Development-appropriate configuration
 * - Cost optimization
 * - Easy cleanup with destroy policy
 *
 * For integration testing:
 * 1. Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`
 * 2. Update the local file with your resource IDs (if needed)
 * 3. Deploy with `cdk deploy {package}-dev`
 */
export class {Package}DevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const config = ConfigResolver.getDevConfig();

        const {resource} = createMyResource(this, {
            ...config,
        });

        // Output important resource information
        new CfnOutput(this, 'ResourceId', {
            value: resource.resourceId,
            description: 'Resource identifier',
        });
    }
}
```

**Production Stack** (`stacks/{package}-prod-stack.ts`):

```typescript
import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createMyResource} from '@cdk-constructs/{package}';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying {Resource} in a production environment.
 *
 * @remarks
 * This stack demonstrates how to use the {Resource} construct with:
 * - Production-grade configuration
 * - High availability
 * - Retain removal policy
 */
export class {Package}ProdStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const config = ConfigResolver.getProdConfig();

        const {resource} = createMyResource(this, {
            ...config,
        });

        // Output important resource information
        new CfnOutput(this, 'ResourceId', {
            value: resource.resourceId,
            description: 'Resource identifier',
        });
    }
}
```

### Step 3: Integrate with Root Project

**Update `lib/types/project.ts`**:

```typescript
import {MyResourceProps} from '@cdk-constructs/{package}';

export type ProjectEnvironment = EnvironmentConfig & {
    // ... existing types

    /**
     * Optional {Package} configuration.
     * If provided, a {Package} stack will be created for this environment.
     */
    {package}?: Partial<MyResourceProps>;
};
```

**Update `bin/app.ts`**:

```typescript
import {{Package}DevStack} from '../examples/{package}/stacks/{package}-dev-stack';
import {{Package}ProdStack} from '../examples/{package}/stacks/{package}-prod-stack';

// In the integrationEnvironments.forEach loop:
if (env.{package}) {
    const envProps = {
        env: {
            account: env.account,
            region: env.region,
        },
    };

    if (env.name === 'dev' || env.name === 'staging') {
        new {Package}DevStack(app, `{package}-${env.name}`, envProps);
    } else if (env.name === 'prod') {
        new {Package}ProdStack(app, `{package}-${env.name}`, envProps);
    }
}
```

**Update `bin/environment.ts`**:

```typescript
export const integrationEnvironments: ProjectEnvironment[] = [
    {
        ...devEnv,
        {package}: {}, // Flag to enable the stack
    },
    {
        ...prodEnv,
        {package}: {}, // Flag to enable the stack
    },
];
```

## Running Examples

### Synthesize All Stacks

```bash
npm run synth
```

This validates that all examples compile and synthesize correctly.

### Deploy Specific Example

```bash
# Deploy dev example
cdk deploy {package}-dev

# Deploy prod example
cdk deploy {package}-prod

# Deploy all examples for a package
cdk deploy {package}-*
```

### List Available Stacks

```bash
cdk list
```

## Example Patterns

### For Packages Without External Dependencies

S3, Lambda, DynamoDB - Services that don't require VPC or other infrastructure:

```typescript
// Simple config resolver - no local overrides needed
export class ConfigResolver {
    public static getDevConfig(): MyResourceProps {
        return DEV_CONFIG;
    }

    public static getProdConfig(): MyResourceProps {
        return PROD_CONFIG;
    }
}
```

### For Packages With External Dependencies

Aurora, ECS, Lambda in VPC - Services that require VPC, subnets, etc:

```typescript
// Config resolver with local overrides for VPC/subnet IDs
export interface LocalConfig {
    vpcId: string;
    subnetIds: string[];
}

export class ConfigResolver {
    private static resolve<T extends {vpcId: string; subnetIds: string[]}>(baseConfig: T): T {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {
                ...baseConfig,
                vpcId: localConfig.vpcId,
                subnetIds: localConfig.subnetIds,
            };
        }
        return baseConfig;
    }

    public static getDevConfig(): MyResourceProps {
        return this.resolve(DEV_CONFIG);
    }
}
```

## Local Override Configuration

Create `examples/environments.local.ts` (gitignored) for local testing:

```typescript
/**
 * Local configuration overrides for integration testing.
 * This file is gitignored and should never be committed.
 */

// Aurora example - VPC configuration
export const LOCAL_CONFIG = {
    vpcId: 'vpc-abc123',
    subnetIds: ['subnet-111', 'subnet-222', 'subnet-333'],
};

// CloudFront example - Custom domain configuration
export const LOCAL_CLOUDFRONT_CONFIG = {
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/...',
    domainNames: ['dev.example.com'],
    hostedZoneId: 'Z1234567890ABC',
    domainName: 'example.com',
    aRecordAddress: 'dev.example.com',
};
```

## Running Tests

### Unit Tests

```bash
# Run tests for specific package
cd packages/{package}
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Integration Tests (Examples)

```bash
# Build all packages
npm run build

# Synthesize all stacks (validates examples)
npm run synth

# Deploy specific example
cdk deploy {package}-dev

# List all available stacks
cdk list
```

## Validation Checklist

When creating a new package:

### Unit Tests

- [ ] Test folder exists: `packages/{package}/test/`
- [ ] Main test file: `{package}.test.ts`
- [ ] Tests for construct creation with valid inputs
- [ ] Tests for error handling with invalid inputs
- [ ] Tests for CloudFormation resource properties
- [ ] Tests for supporting resources (roles, log groups, etc.)
- [ ] Tests for default values
- [ ] Tests for optional parameters
- [ ] All tests pass: `npm test`

### Integration Tests (Examples)

- [ ] Development config file with appropriate settings
- [ ] Production config file with appropriate settings
- [ ] Config resolver with local override support (if needed)
- [ ] Development stack with CloudFormation outputs
- [ ] Production stack with CloudFormation outputs
- [ ] Integration with `lib/types/project.ts`
- [ ] Integration with `bin/app.ts`
- [ ] Integration with `bin/environment.ts`
- [ ] `npm run build` succeeds
- [ ] `npm run synth` succeeds
- [ ] Stack appears in `cdk list`
- [ ] Example stacks include comprehensive documentation
- [ ] Local override pattern documented (if applicable)

## Benefits of Two-Tier Testing

### Unit Tests

1. **Fast Feedback**: Run in milliseconds, no AWS account needed
2. **Isolated Testing**: Test individual construct behavior
3. **Edge Cases**: Easy to test error conditions and boundary cases
4. **Regression Prevention**: Catch breaking changes immediately
5. **CI/CD Friendly**: Fast enough to run on every commit

### Integration Tests (Examples)

1. **Real Validation**: Examples can be deployed to AWS, ensuring constructs actually work
2. **Living Documentation**: Examples show actual usage, not just API signatures
3. **Quick Feedback**: `npm run synth` validates all examples instantly
4. **Environment Awareness**: Dev/staging/prod variants show best practices
5. **Safe Defaults**: Placeholder values prevent accidental resource creation
6. **Local Testing**: Override mechanism allows integration testing without committing credentials
7. **Open Source Ready**: Examples work out of the box with safe placeholder values

### Together

- Unit tests ensure **correctness** at the construct level
- Integration tests ensure **usability** in real scenarios
- Both provide confidence for open source contributions

## Testing Best Practices

1. **Unit Test First**: Write unit tests for core functionality before examples
2. **Test Public API**: Focus on exported functions and types, not internals
3. **Use CDK Assertions**: Leverage `Template.hasResourceProperties()` and similar
4. **Test Defaults**: Ensure sensible defaults work without configuration
5. **Test Error Cases**: Validate proper error messages for invalid inputs
6. **Keep Tests Fast**: Unit tests should run in milliseconds
7. **Document Examples**: Integration tests should have clear documentation
8. **Use Snapshots Sparingly**: Prefer specific assertions over full snapshot tests

## Common Testing Patterns

### Testing Resource Creation

```typescript
test('creates resource with required properties', () => {
    const {resource} = createMyResource(stack, {resourceName: 'test'});

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Service::Resource', 1);
    template.hasResourceProperties('AWS::Service::Resource', {
        ResourceName: 'test',
    });
});
```

### Testing Supporting Resources

```typescript
test('creates IAM role with correct permissions', () => {
    createMyResource(stack, {resourceName: 'test'});

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
        AssumedBy: {
            Service: 'myservice.amazonaws.com',
        },
    });
});
```

### Testing Default Values

```typescript
test('applies default removal policy', () => {
    createMyResource(stack, {
        resourceName: 'test',
        // Don't specify removalPolicy
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Service::Resource', {
        DeletionPolicy: 'Destroy', // Default
    });
});
```

### Testing Error Handling

```typescript
test('throws error for missing required property', () => {
    expect(() => {
        createMyResource(stack, {} as any);
    }).toThrow('resourceName is required');
});
```

## See Also

- [Creating Subpackages Guide](../creating-subpackages/SKILL.md) - Overall package structure
- Existing unit tests: `packages/aurora/test/`, `packages/s3/test/`
- Existing examples: `examples/aurora/`, `examples/s3/`, `examples/cloudfront/`
- [CDK Testing Documentation](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
