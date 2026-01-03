# CDK Constructs Library

A comprehensive AWS Cloud Development Kit (CDK) library providing infrastructure-as-code constructs and utilities for AWS applications.

## Overview

This is a **monorepo managed with npm workspaces** that provides a collection of reusable AWS CDK constructs, utilities, and configuration patterns. The project simplifies the creation, deployment, and management of AWS infrastructure across multiple environments.

### Project Goals

This repository serves as a comprehensive monorepo of subpackages that apply **platform engineering paved roads** for AWS services. Our constructs are designed to:

- **Reduce Developer Cognitive Load**: Provide opinionated, battle-tested patterns that abstract away complexity while maintaining flexibility
- **Cost Effectiveness**: Implement best practices for resource optimization and cost management
- **Environmental Consciousness**: Promote efficient resource utilization and sustainable cloud practices
- **Accelerate Development**: Enable teams to focus on business logic rather than infrastructure boilerplate

## Packages

This monorepo contains the following packages:

### Core Package

| Package                  | Version | Description                                                           |
| ------------------------ | ------- | --------------------------------------------------------------------- |
| [@cdk-constructs/cdk](.) | 0.1.0   | Root package with core utilities, types, enums, and legacy constructs |

### Subpackages Compatibility Matrix

| Package                                               | Version | CDK Version | Node Version | Description                                     |
| ----------------------------------------------------- | ------- | ----------- | ------------ | ----------------------------------------------- |
| [@cdk-constructs/aws](packages/aws)                   | 0.1.0   | ^2.225.0    | >=24         | AWS account, region, and environment enums      |
| [@cdk-constructs/aurora](packages/aurora)             | 0.1.0   | ^2.225.0    | >=24         | Aurora MySQL and PostgreSQL database constructs |
| [@cdk-constructs/codeartifact](packages/codeartifact) | 0.1.0   | ^2.225.0    | >=24         | CodeArtifact domain and repository constructs   |

### Dependency Resolution

```
@cdk-constructs/cdk (root)
├── @cdk-constructs/aws
├── @cdk-constructs/aurora
└── @cdk-constructs/codeartifact (depends on: aws@*)
```

### Root Package Constructs

The following constructs remain in the root package and will be migrated to subpackages in future releases:

- **Database Migration**: DMS replication instances and tasks
- **Search & Analytics**: OpenSearch domain creation
- **Caching**: Redis ElastiCache cluster creation
- **Content Delivery**: CloudFront + S3 distributions
- **Streaming**: Kinesis data streams

## Installation

### Prerequisites

- Node.js >= 24.x
- npm >= 10.x
- AWS CDK 2.225.0

### Installing Packages

```bash
# Install root package
npm install @cdk-constructs/cdk --save-exact

# Install subpackages as needed
npm install @cdk-constructs/aws --save-exact
npm install @cdk-constructs/aurora --save-exact
npm install @cdk-constructs/codeartifact --save-exact
```

## Development

### Quick Start with Make

This project uses a Makefile for all development tasks:

```bash
# Install dependencies and set up git hooks
make install

# Build everything (workspaces + CDK app)
make build-all

# Run linting and formatting checks
make check

# Deploy CDK stacks to AWS
make deploy
```

### Common Make Commands

#### Development Setup

```bash
make install              # Install all dependencies and set up git hooks
```

#### Build Commands

```bash
make build                # Build all workspace packages
make build-app            # Build CDK app (bin/, lib/)
make build-all            # Build everything (workspaces + app)
make clean                # Remove all build artifacts

# Build specific workspace
make build-workspace PACKAGE=aws           # Build @cdk-constructs/aws
make build-workspace PACKAGE=aurora        # Build @cdk-constructs/aurora
make build-workspace PACKAGE=codeartifact  # Build @cdk-constructs/codeartifact

# Or use individual targets
make build-aws            # Build @cdk-constructs/aws
make build-aurora         # Build @cdk-constructs/aurora
make build-codeartifact   # Build @cdk-constructs/codeartifact
```

#### Code Quality

```bash
make lint                 # Run ESLint on all TypeScript files
make lint-fix             # Fix linting issues automatically
a               # Format code with Prettier
make format-check         # Check code formatting without making changes
make check                # Run all quality checks (format + lint)
```

#### CDK Operations

```bash
make synth                # Synthesize CloudFormation templates
make diff                 # Show CDK diff against deployed stacks
make deploy               # Deploy CDK stacks to AWS
make deploy-stack STACK=StackName  # Deploy specific stack
```

#### Testing

```bash
make test                 # Run tests
```

#### CI/CD

```bash
make ci-check             # CI check - format check, lint, and build
make ci-build             # CI build - checks + full build
make ci-deploy            # CI deploy - checks + build + synth
```

#### Publishing

```bash
# Publish all packages (runs all pre-validation steps)
make publish              # Format check + lint + test + build + publish

# Publish individual packages
make publish-aws          # Publish @cdk-constructs/aws
make publish-aurora       # Publish @cdk-constructs/aurora
make publish-codeartifact # Publish @cdk-constructs/codeartifact

# Or publish specific workspace
make publish-workspace PACKAGE=aws
make publish-workspace PACKAGE=aurora

# Just authenticate with CodeArtifact
make codeartifact-login
```

**Environment Variables for Publishing:**

```bash
# Override CodeArtifact configuration
export CODEARTIFACT_DOMAIN=my-domain
export CODEARTIFACT_REPOSITORY=my-repo
export AWS_REGION=us-east-1

make publish
```

**Pre-publish Validation:**

The `make publish` command automatically runs:

1. ✅ Version checks (Node.js >= 24, npm >= 10)
2. ✅ Format validation (`format-check`)
3. ✅ Linting (`lint`)
4. ✅ Tests (`test`)
5. ✅ Full build (`build-all`)
6. ✅ CodeArtifact authentication
7. ✅ Package publishing

For a complete list of available commands, run:

```bash
make help
```

### Workspace Setup

```bash
# Clone the repository
git clone <repository-url>
cd cdk-constructs-library

# Install dependencies (workspace symlinks created automatically)
make install

# Build all packages
make build-all
```

### Workspace Structure

```
cdk-constructs-library/
├── package.json              # Root package with workspace configuration
├── Makefile                  # Build automation and common tasks
├── packages/
│   ├── aws/                 # AWS account, region, and environment enums
│   ├── aurora/              # Aurora MySQL and PostgreSQL database constructs
│   └── codeartifact/        # CodeArtifact domain and repository constructs
├── examples/
│   └── aurora/              # Aurora example stacks and configurations
├── src/                     # Root package source
├── bin/                     # CDK app entry points
├── lib/                     # CDK app stacks
└── docs/                    # Documentation
```

## Key Features

- **Monorepo Architecture**: Organized workspace structure with npm workspaces
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Modular Design**: Independent subpackages with clear dependency boundaries
- **Reusable Constructs**: Battle-tested constructs for common AWS services
- **Independent Versioning**: Subpackages can be versioned and published independently
- **No Circular Dependencies**: Carefully structured to prevent dependency loops

## Requirements

- **Node.js**: >= 24.x
- **AWS CDK**: 2.225.0
- **TypeScript**: >= 5.x
- **AWS CLI**: Configured with appropriate credentials

## Project Plan

For detailed information about the project structure, migration strategy, and architecture, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
