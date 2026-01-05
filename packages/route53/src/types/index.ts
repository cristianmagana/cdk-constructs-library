// Base types
export type {Route53BaseConfig, Route53BaseResources} from './route53-base';

// Hosted zone types
export type {
    PublicHostedZoneProps,
    PublicHostedZoneResources,
    PrivateHostedZoneProps,
    PrivateHostedZoneResources,
    SubdomainDelegationProps,
} from './hosted-zone';

// Resolver types
export type {ResolverEndpointProps, ResolverEndpointResources} from './resolver';

// ACM certificate types
export type {AcmCertificateProps, AcmCertificateResources} from './acm-certificate';

// VPC association types
export type {VpcAssociationProps, VpcAssociationResources} from './vpc-association';
