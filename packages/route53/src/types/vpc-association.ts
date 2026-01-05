import {AwsCustomResource} from 'aws-cdk-lib/custom-resources';

/**
 * Configuration for associating a VPC with a private hosted zone.
 *
 * @remarks
 * Use this to associate additional VPCs with a private hosted zone,
 * especially VPCs in different regions.
 *
 * @public
 */
export type VpcAssociationProps = {
    /**
     * The VPC ID to associate with the hosted zone.
     */
    vpcId: string;

    /**
     * The hosted zone ID.
     */
    hostedZoneId: string;

    /**
     * AWS region where the VPC exists.
     *
     * @remarks
     * This allows cross-region VPC associations.
     *
     * @example
     * ```typescript
     * region: 'us-west-2'
     * ```
     */
    region: string;

    /**
     * Comment for the VPC association.
     */
    comment?: string;
};

/**
 * Resources created by the VPC association construct.
 *
 * @public
 */
export type VpcAssociationResources = {
    /**
     * The custom resource that manages the VPC association.
     */
    association: AwsCustomResource;
};
