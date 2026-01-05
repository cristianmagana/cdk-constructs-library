import {RemovalPolicy} from 'aws-cdk-lib';
import {PublicHostedZoneProps, PrivateHostedZoneProps, ResolverEndpointProps} from '@cdk-constructs/route53';

/**
 * Production environment configuration for Route53 public hosted zone.
 *
 * @remarks
 * This configuration creates a production public hosted zone with:
 * - Retain removal policy to prevent accidental deletion
 * - Cross-account delegation enabled for subdomain management
 * - Production-grade domain naming
 */
export const PUBLIC_ZONE_PROD_CONFIG: PublicHostedZoneProps = {
    zoneName: 'cdk-constructs-example.com',
    comment: 'Production public DNS zone for CDK constructs',
    removalPolicy: RemovalPolicy.RETAIN,
    enableCrossAccountDelegation: true,
    delegationAccountIds: [
        // Add your dev/staging account IDs here for subdomain delegation
        '123456789012', // Placeholder - replace with actual account ID
    ],
    delegationRoleName: 'dns-delegation-role',
};

/**
 * Production environment configuration for Route53 private hosted zone.
 *
 * @remarks
 * This configuration creates a production private hosted zone with:
 * - VPC association (requires VPC lookup)
 * - Retain removal policy to prevent accidental deletion
 * - Cross-region VPC associations for multi-region architecture
 * - Internal domain naming
 *
 * **Note**: You must provide a VPC in the stack. Use a placeholder or
 * configure via environments.local.ts for integration testing.
 */
export const PRIVATE_ZONE_PROD_CONFIG = {
    zoneName: 'internal.cdk-constructs-example.com',
    comment: 'Production private DNS zone for CDK constructs',
    removalPolicy: RemovalPolicy.RETAIN,
    // vpc is set in the stack based on lookup or local config
    // additionalVpcs can be configured for cross-region VPC associations
} as Omit<PrivateHostedZoneProps, 'vpc'>;

/**
 * Production environment configuration for Route53 Resolver endpoint.
 *
 * @remarks
 * This configuration creates a production resolver endpoint with:
 * - Inbound DNS resolution
 * - Corporate network access (10.0.0.0/8)
 * - High availability across 3 subnets
 * - Production tagging
 *
 * **Note**: You must provide a VPC in the stack.
 */
export const RESOLVER_PROD_CONFIG = {
    endpointName: 'corp-resolver-prod',
    direction: 'INBOUND' as const,
    allowedCidr: '10.0.0.0/8',
    ipAddressCount: 3,
    tags: {
        Environment: 'prod',
        Purpose: 'Corporate DNS resolution',
        Compliance: 'SOC2',
    },
    // vpc is set in the stack based on lookup or local config
} as Omit<ResolverEndpointProps, 'vpc'>;
