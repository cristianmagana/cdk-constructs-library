import {IVpc} from 'aws-cdk-lib/aws-ec2';
import {IHostedZone, IPublicHostedZone, IPrivateHostedZone} from 'aws-cdk-lib/aws-route53';
import {IRole} from 'aws-cdk-lib/aws-iam';
import {Route53BaseConfig} from './route53-base';

/**
 * Configuration for creating a public hosted zone.
 *
 * @public
 */
export type PublicHostedZoneProps = Route53BaseConfig & {
    /**
     * The name of the domain.
     *
     * @remarks
     * This should be a fully qualified domain name (FQDN) like "example.com"
     * Do not include a trailing dot.
     *
     * @example
     * ```typescript
     * zoneName: 'example.com'
     * ```
     */
    zoneName: string;

    /**
     * Enable cross-account delegation.
     *
     * @remarks
     * When enabled, creates a delegation role that allows other accounts
     * to create NS records in this zone for subdomain delegation.
     *
     * @defaultValue false
     */
    enableCrossAccountDelegation?: boolean;

    /**
     * Account IDs allowed to assume the delegation role.
     *
     * @remarks
     * Required when enableCrossAccountDelegation is true.
     * These accounts will be able to create NS records in this zone.
     */
    delegationAccountIds?: string[];

    /**
     * Name for the cross-account delegation role.
     *
     * @remarks
     * If not specified, defaults to `${zoneName}-delegation-role`
     */
    delegationRoleName?: string;
};

/**
 * Resources created by the public hosted zone construct.
 *
 * @public
 */
export type PublicHostedZoneResources = {
    /**
     * The public hosted zone.
     */
    hostedZone: IPublicHostedZone;

    /**
     * Cross-account delegation role, if enabled.
     */
    delegationRole?: IRole;
};

/**
 * Configuration for creating a private hosted zone.
 *
 * @public
 */
export type PrivateHostedZoneProps = Route53BaseConfig & {
    /**
     * The name of the domain.
     *
     * @remarks
     * This should be a fully qualified domain name (FQDN) like "internal.example.com"
     * Do not include a trailing dot.
     *
     * @example
     * ```typescript
     * zoneName: 'internal.example.com'
     * ```
     */
    zoneName: string;

    /**
     * The VPC to associate with the private hosted zone.
     *
     * @remarks
     * This is the primary VPC for the zone. Additional VPCs can be associated
     * using the VPC association construct.
     */
    vpc: IVpc;

    /**
     * Additional VPCs to associate with the zone.
     *
     * @remarks
     * Use this for cross-region VPC associations. Each association requires
     * the VPC ID and region.
     */
    additionalVpcs?: Array<{
        /**
         * VPC ID to associate.
         */
        vpcId: string;

        /**
         * AWS region where the VPC exists.
         */
        region: string;
    }>;
};

/**
 * Resources created by the private hosted zone construct.
 *
 * @public
 */
export type PrivateHostedZoneResources = {
    /**
     * The private hosted zone.
     */
    hostedZone: IPrivateHostedZone;
};

/**
 * Configuration for delegating a subdomain to another hosted zone.
 *
 * @public
 */
export type SubdomainDelegationProps = {
    /**
     * The subdomain hosted zone to delegate.
     */
    delegatedZone: IHostedZone;

    /**
     * The parent hosted zone ID.
     *
     * @remarks
     * This is the zone where the NS record will be created.
     */
    parentHostedZoneId: string;

    /**
     * The delegation role ARN.
     *
     * @remarks
     * This role must have permissions to create NS records in the parent zone.
     * Use the role created by enableCrossAccountDelegation on the parent zone.
     */
    delegationRoleArn: string;
};
