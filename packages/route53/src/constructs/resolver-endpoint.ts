import {Construct} from 'constructs';
import {Peer, Port, SecurityGroup} from 'aws-cdk-lib/aws-ec2';
import {CfnResolverEndpoint} from 'aws-cdk-lib/aws-route53resolver';
import {ResolverEndpointProps, ResolverEndpointResources} from '../types/resolver';

/**
 * Creates a Route53 Resolver endpoint for hybrid cloud DNS resolution.
 *
 * @remarks
 * This construct creates a production-ready resolver endpoint with:
 * - High availability across multiple subnets
 * - Automatic security group with DNS access control
 * - Support for both inbound and outbound DNS resolution
 * - Integration with on-premises DNS infrastructure
 *
 * Inbound endpoints allow on-premises resources to resolve VPC DNS names.
 * Outbound endpoints allow VPC resources to resolve on-premises DNS names.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Resources including the resolver endpoint and security group
 *
 * @example
 * ```typescript
 * import { createResolverEndpoint } from '@cdk-constructs/route53';
 * import { Vpc } from 'aws-cdk-lib/aws-ec2';
 *
 * const vpc = Vpc.fromLookup(this, 'VPC', { vpcId: 'vpc-xxx' });
 *
 * // Inbound resolver for on-premises to VPC DNS resolution
 * const { endpoint } = createResolverEndpoint(this, {
 *   endpointName: 'corp-inbound-resolver',
 *   vpc,
 *   direction: 'INBOUND',
 *   allowedCidr: '10.0.0.0/8',
 * });
 *
 * // Outbound resolver for VPC to on-premises DNS resolution
 * const { endpoint } = createResolverEndpoint(this, {
 *   endpointName: 'on-prem-outbound-resolver',
 *   vpc,
 *   direction: 'OUTBOUND',
 * });
 * ```
 *
 * @see {@link ResolverEndpointProps} for configuration options
 * @see https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html
 * @public
 */
export const createResolverEndpoint = (scope: Construct, props: ResolverEndpointProps): ResolverEndpointResources => {
    const direction = props.direction || 'INBOUND';
    const ipAddressCount = props.ipAddressCount || 3;

    // Validate IP address count
    if (ipAddressCount < 2 || ipAddressCount > 10) {
        throw new Error('ipAddressCount must be between 2 and 10');
    }

    // Validate VPC has enough private subnets
    if (props.vpc.privateSubnets.length < ipAddressCount) {
        throw new Error(
            `VPC must have at least ${ipAddressCount} private subnets for the resolver endpoint, ` + `but only ${props.vpc.privateSubnets.length} were found`
        );
    }

    // Create or use provided security group
    const securityGroup =
        props.securityGroup ||
        new SecurityGroup(scope, `${props.endpointName}-sg`, {
            vpc: props.vpc,
            allowAllOutbound: true,
            securityGroupName: `${props.endpointName}-resolver-sg`,
            description: `Security group for ${props.endpointName} Route53 Resolver endpoint`,
        });

    // For inbound endpoints, add ingress rule for DNS from allowed CIDR
    if (direction === 'INBOUND' && props.allowedCidr) {
        securityGroup.addIngressRule(Peer.ipv4(props.allowedCidr), Port.tcp(53), `Allow DNS TCP from ${props.allowedCidr}`);

        securityGroup.addIngressRule(Peer.ipv4(props.allowedCidr), Port.udp(53), `Allow DNS UDP from ${props.allowedCidr}`);
    }

    // Build IP addresses configuration using private subnets
    const ipAddresses = Array.from({length: ipAddressCount}, (_, i) => ({
        subnetId: props.vpc.privateSubnets[i].subnetId,
    }));

    // Create the resolver endpoint
    const endpoint = new CfnResolverEndpoint(scope, `${props.endpointName}-endpoint`, {
        name: `${props.endpointName}-resolver`,
        direction,
        ipAddresses,
        securityGroupIds: [securityGroup.securityGroupId],
        resolverEndpointType: 'IPV4',
        tags: [
            {
                key: 'Name',
                value: `${props.endpointName}-resolver`,
            },
            {
                key: 'VPC',
                value: props.vpc.vpcId,
            },
            ...(props.tags
                ? Object.entries(props.tags).map(([key, value]) => ({
                      key,
                      value,
                  }))
                : []),
        ],
    });

    return {
        endpoint,
        securityGroup,
    };
};
