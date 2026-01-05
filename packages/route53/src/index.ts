/**
 * Route53 DNS, hosted zones, and resolver constructs for CDK.
 *
 * @packageDocumentation
 */

// Construct functions
export {createPublicHostedZone, createPrivateHostedZone, createSubdomainDelegation} from './constructs/hosted-zone';
export {createResolverEndpoint} from './constructs/resolver-endpoint';
export {createAcmCertificate} from './constructs/acm-certificate';

// Utility functions
export {associateVpcWithHostedZone} from './util/vpc-association';

// Type exports
export type {
    // Base types
    Route53BaseConfig,
    Route53BaseResources,

    // Hosted zone types
    PublicHostedZoneProps,
    PublicHostedZoneResources,
    PrivateHostedZoneProps,
    PrivateHostedZoneResources,
    SubdomainDelegationProps,

    // Resolver types
    ResolverEndpointProps,
    ResolverEndpointResources,

    // ACM certificate types
    AcmCertificateProps,
    AcmCertificateResources,

    // VPC association types
    VpcAssociationProps,
    VpcAssociationResources,
} from './types';
