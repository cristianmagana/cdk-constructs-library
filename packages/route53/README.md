# @cdk-constructs/route53

AWS Route53 DNS, hosted zones, and resolver constructs for CDK.

## Features

- **Public Hosted Zones**: Create and manage public DNS zones
- **Private Hosted Zones**: VPC-associated private DNS zones with cross-region VPC association
- **Route53 Resolver Endpoints**: Inbound DNS resolution for hybrid cloud scenarios
- **ACM Certificates**: Automatic DNS-validated certificates with optional cross-region support
- **Cross-Account Delegation**: Delegate subdomains across AWS accounts

## Installation

```bash
npm install @cdk-constructs/route53
```

## Usage

### Public Hosted Zone

```typescript
import {createPublicHostedZone} from '@cdk-constructs/route53';

const {hostedZone} = createPublicHostedZone(this, {
    zoneName: 'example.com',
    comment: 'My public DNS zone',
});
```

### Private Hosted Zone

```typescript
import {createPrivateHostedZone} from '@cdk-constructs/route53';
import {Vpc} from 'aws-cdk-lib/aws-ec2';

const vpc = Vpc.fromLookup(this, 'VPC', {vpcId: 'vpc-xxx'});

const {hostedZone} = createPrivateHostedZone(this, {
    zoneName: 'internal.example.com',
    vpc,
    comment: 'Private DNS zone',
});
```

### Route53 Resolver Endpoint

```typescript
import {createResolverEndpoint} from '@cdk-constructs/route53';

const {endpoint} = createResolverEndpoint(this, {
    endpointName: 'corp-resolver',
    vpc,
    allowedCidr: '10.0.0.0/8',
});
```

### ACM Certificate with DNS Validation

```typescript
import {createAcmCertificate} from '@cdk-constructs/route53';

const {certificate} = createAcmCertificate(this, {
    certificateName: 'example-cert',
    domainName: 'example.com',
    hostedZone,
    subjectAlternativeNames: ['*.example.com'],
});
```

### Cross-Region ACM Certificate (opt-in)

For CloudFront distributions, you may need certificates in us-east-1:

```typescript
const {certificate, crossRegionCertificate} = createAcmCertificate(this, {
    certificateName: 'example-cert',
    domainName: 'example.com',
    hostedZone,
    subjectAlternativeNames: ['*.example.com'],
    enableCrossRegion: true,
    crossRegionConfig: {
        region: 'us-east-1',
    },
});
```

## License

Apache-2.0
