import {IVpc} from 'aws-cdk-lib/aws-ec2';
import {ISecurityGroup} from 'aws-cdk-lib/aws-ec2';
import {CfnResolverEndpoint} from 'aws-cdk-lib/aws-route53resolver';

/**
 * Configuration for creating a Route53 Resolver endpoint.
 *
 * @remarks
 * Route53 Resolver endpoints enable DNS resolution between your VPC and on-premises networks.
 * Use inbound endpoints to allow on-premises resources to resolve VPC DNS names.
 * Use outbound endpoints to allow VPC resources to resolve on-premises DNS names.
 *
 * @public
 */
export type ResolverEndpointProps = {
    /**
     * Name for the resolver endpoint.
     *
     * @remarks
     * This will be used for resource naming and tagging.
     *
     * @example
     * ```typescript
     * endpointName: 'corp-resolver'
     * ```
     */
    endpointName: string;

    /**
     * The VPC where the resolver endpoint will be created.
     */
    vpc: IVpc;

    /**
     * Direction of DNS queries.
     *
     * @remarks
     * - INBOUND: Allows on-premises to resolve VPC DNS names
     * - OUTBOUND: Allows VPC to resolve on-premises DNS names
     *
     * @defaultValue 'INBOUND'
     */
    direction?: 'INBOUND' | 'OUTBOUND';

    /**
     * CIDR block allowed to send DNS queries.
     *
     * @remarks
     * For INBOUND endpoints, this should be your corporate network CIDR.
     * For OUTBOUND endpoints, this is typically not needed.
     *
     * @example
     * ```typescript
     * allowedCidr: '10.0.0.0/8'
     * ```
     */
    allowedCidr?: string;

    /**
     * Custom security group for the resolver endpoint.
     *
     * @remarks
     * If not provided, a security group will be created automatically.
     * The security group allows DNS (port 53) from the allowedCidr.
     */
    securityGroup?: ISecurityGroup;

    /**
     * Number of IP addresses to use for the endpoint.
     *
     * @remarks
     * Must be between 2 and 10. The endpoint will be created across
     * this many subnets for high availability.
     *
     * @defaultValue 3 (uses 3 private subnets)
     */
    ipAddressCount?: number;

    /**
     * Tags to apply to the resolver endpoint.
     */
    tags?: Record<string, string>;
};

/**
 * Resources created by the resolver endpoint construct.
 *
 * @public
 */
export type ResolverEndpointResources = {
    /**
     * The Route53 Resolver endpoint.
     */
    endpoint: CfnResolverEndpoint;

    /**
     * Security group for the endpoint.
     */
    securityGroup: ISecurityGroup;
};
