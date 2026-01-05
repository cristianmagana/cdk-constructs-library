import {Construct} from 'constructs';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from 'aws-cdk-lib/custom-resources';
import {VpcAssociationProps, VpcAssociationResources} from '../types/vpc-association';

/**
 * Associates a VPC with a private hosted zone using a custom resource.
 *
 * @remarks
 * This utility creates a custom resource to associate a VPC with a private
 * hosted zone, supporting cross-region VPC associations. This is useful when
 * you have VPCs in multiple regions that need to resolve the same private DNS names.
 *
 * The custom resource handles the AssociateVPCWithHostedZone API call and
 * creates the necessary IAM permissions.
 *
 * @param scope - The construct scope
 * @param id - Unique identifier for the association resource
 * @param props - Configuration properties
 * @returns Resources including the custom resource
 *
 * @example
 * ```typescript
 * import { associateVpcWithHostedZone } from '@cdk-constructs/route53';
 *
 * const association = associateVpcWithHostedZone(this, 'west-vpc-association', {
 *   vpcId: 'vpc-xxx',
 *   hostedZoneId: privateZone.hostedZoneId,
 *   region: 'us-west-2',
 *   comment: 'Associate us-west-2 VPC with private zone',
 * });
 * ```
 *
 * @see {@link VpcAssociationProps} for configuration options
 * @see https://docs.aws.amazon.com/Route53/latest/APIReference/API_AssociateVPCWithHostedZone.html
 * @public
 */
export const associateVpcWithHostedZone = (scope: Construct, id: string, props: VpcAssociationProps): VpcAssociationResources => {
    const regionObject = props.region ? {region: props.region} : {};

    const awsCall = {
        service: 'Route53',
        action: 'associateVPCWithHostedZone',
        parameters: {
            HostedZoneId: props.hostedZoneId,
            VPC: {
                VPCId: props.vpcId,
                VPCRegion: props.region,
            },
            Comment: props.comment || `Associate VPC ${props.vpcId} in ${props.region}`,
        },
        physicalResourceId: PhysicalResourceId.of(id),
        ...regionObject,
    };

    const association = new AwsCustomResource(scope, id, {
        policy: AwsCustomResourcePolicy.fromStatements([
            new PolicyStatement({
                actions: ['ec2:DescribeVpcs', 'route53:AssociateVPCWithHostedZone'],
                resources: ['*'],
            }),
        ]),
        logRetention: RetentionDays.ONE_WEEK,
        onCreate: awsCall,
        installLatestAwsSdk: false,
    });

    return {
        association,
    };
};
