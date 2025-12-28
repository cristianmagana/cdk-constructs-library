import {Construct} from 'constructs';
import {IVpc, Vpc, SubnetSelection} from 'aws-cdk-lib/aws-ec2';

/**
 * Looks up an existing VPC by ID.
 *
 * @param scope - The construct scope
 * @param id - Unique identifier for this construct
 * @param vpcId - The VPC ID to lookup
 * @returns The VPC interface
 *
 * @example
 * ```typescript
 * const vpc = getVpc(this, 'VPC', 'vpc-xxxxxxxxxxxxx');
 * ```
 *
 * @public
 */
export const getVpc = (scope: Construct, id: string, vpcId: string): IVpc => {
    return Vpc.fromLookup(scope, id, {vpcId});
};

/**
 * Selects specific subnets from a VPC by subnet IDs.
 *
 * @param vpc - The VPC to select subnets from
 * @param subnetIds - Array of subnet IDs to select
 * @returns SubnetSelection containing the filtered subnets
 *
 * @example
 * ```typescript
 * const vpc = getVpc(this, 'VPC', 'vpc-xxxxxxxxxxxxx');
 * const subnetSelection = selectSubnetsByIds(vpc, [
 *   'subnet-abc123',
 *   'subnet-def456',
 *   'subnet-ghi789',
 * ]);
 *
 * // Use with Aurora cluster
 * const {cluster} = createAuroraMySqlCluster(this, 'Cluster', {
 *   // ...
 *   vpcSubnets: subnetSelection,
 * });
 * ```
 *
 * @public
 */
export const selectSubnetsByIds = (vpc: IVpc, subnetIds: string[]): SubnetSelection => {
    return {
        subnets: vpc.privateSubnets.filter(subnet => subnetIds.includes(subnet.subnetId)),
    };
};
