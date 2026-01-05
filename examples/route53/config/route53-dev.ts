import {RemovalPolicy} from 'aws-cdk-lib';
import {PublicHostedZoneProps, PrivateHostedZoneProps, ResolverEndpointProps} from '@cdk-constructs/route53';

/**
 * Development environment configuration for Route53 public hosted zone.
 *
 * @remarks
 * This configuration creates a dev public hosted zone with:
 * - Destroy removal policy for easy cleanup
 * - Optional cross-account delegation disabled by default
 */
export const PUBLIC_ZONE_DEV_CONFIG: PublicHostedZoneProps = {
    zoneName: 'dev.cdk-constructs-example.com',
    comment: 'Development public DNS zone for CDK constructs example',
    removalPolicy: RemovalPolicy.DESTROY,
    enableCrossAccountDelegation: false,
};

/**
 * Development environment configuration for Route53 private hosted zone.
 *
 * @remarks
 * This configuration creates a dev private hosted zone with:
 * - VPC association (requires VPC lookup)
 * - Destroy removal policy for easy cleanup
 * - Internal domain naming
 *
 * **Note**: You must provide a VPC in the stack. Use a placeholder or
 * configure via environments.local.ts for integration testing.
 */
export const PRIVATE_ZONE_DEV_CONFIG = {
    zoneName: 'internal.dev.cdk-constructs-example.com',
    comment: 'Development private DNS zone for CDK constructs example',
    removalPolicy: RemovalPolicy.DESTROY,
    // vpc is set in the stack based on lookup or local config
} as Omit<PrivateHostedZoneProps, 'vpc'>;

/**
 * Development environment configuration for Route53 Resolver endpoint.
 *
 * @remarks
 * This configuration creates a dev resolver endpoint with:
 * - Inbound DNS resolution
 * - Corporate network access (10.0.0.0/8)
 * - High availability across 3 subnets
 *
 * **Note**: You must provide a VPC in the stack.
 */
export const RESOLVER_DEV_CONFIG = {
    endpointName: 'corp-resolver-dev',
    direction: 'INBOUND' as const,
    allowedCidr: '10.0.0.0/8',
    ipAddressCount: 3,
    tags: {
        Environment: 'dev',
        Purpose: 'Corporate DNS resolution',
    },
    // vpc is set in the stack based on lookup or local config
} as Omit<ResolverEndpointProps, 'vpc'>;
