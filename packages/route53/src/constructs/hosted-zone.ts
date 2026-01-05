import {Construct} from 'constructs';
import {PublicHostedZone, PrivateHostedZone, CrossAccountZoneDelegationRecord} from 'aws-cdk-lib/aws-route53';
import {AccountPrincipal, CompositePrincipal, PolicyDocument, PolicyStatement, Role} from 'aws-cdk-lib/aws-iam';
import {
    PublicHostedZoneProps,
    PublicHostedZoneResources,
    PrivateHostedZoneProps,
    PrivateHostedZoneResources,
    SubdomainDelegationProps,
} from '../types/hosted-zone';
import {associateVpcWithHostedZone} from '../util/vpc-association';

/**
 * Creates a Route53 public hosted zone with optional cross-account delegation.
 *
 * @remarks
 * This construct creates a production-ready public hosted zone with:
 * - DNS name servers for domain registration
 * - Optional cross-account delegation role for subdomain delegation
 * - Support for multi-account DNS architectures
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Resources including the hosted zone and optional delegation role
 *
 * @example
 * ```typescript
 * import { createPublicHostedZone } from '@cdk-constructs/route53';
 *
 * const { hostedZone } = createPublicHostedZone(this, {
 *   zoneName: 'example.com',
 *   comment: 'Production DNS zone',
 * });
 *
 * // With cross-account delegation
 * const { hostedZone, delegationRole } = createPublicHostedZone(this, {
 *   zoneName: 'example.com',
 *   enableCrossAccountDelegation: true,
 *   delegationAccountIds: ['123456789012', '210987654321'],
 * });
 * ```
 *
 * @see {@link PublicHostedZoneProps} for configuration options
 * @see https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html
 * @public
 */
export const createPublicHostedZone = (scope: Construct, props: PublicHostedZoneProps): PublicHostedZoneResources => {
    const hostedZone = new PublicHostedZone(scope, props.zoneName, {
        zoneName: props.zoneName,
        comment: props.comment,
    });

    // Apply removal policy if specified
    if (props.removalPolicy) {
        hostedZone.applyRemovalPolicy(props.removalPolicy);
    }

    let delegationRole: Role | undefined;

    // Create cross-account delegation role if enabled
    if (props.enableCrossAccountDelegation) {
        if (!props.delegationAccountIds || props.delegationAccountIds.length === 0) {
            throw new Error('delegationAccountIds must be provided when enableCrossAccountDelegation is true');
        }

        const principals = props.delegationAccountIds.map(accountId => new AccountPrincipal(accountId));
        const compositePrincipal = new CompositePrincipal(...principals);

        const roleName = props.delegationRoleName || `${props.zoneName.replace(/\./g, '-')}-delegation-role`;

        delegationRole = new Role(scope, `${props.zoneName}-delegation-role`, {
            roleName,
            assumedBy: compositePrincipal,
            inlinePolicies: {
                delegation: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ['route53:ChangeResourceRecordSets'],
                            resources: [hostedZone.hostedZoneArn],
                            conditions: {
                                'ForAllValues:StringEquals': {
                                    'route53:ChangeResourceRecordSetsRecordTypes': ['NS'],
                                    'route53:ChangeResourceRecordSetsActions': ['UPSERT', 'DELETE'],
                                },
                            },
                        }),
                        new PolicyStatement({
                            actions: ['route53:ListHostedZonesByName'],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
    }

    return {
        hostedZone,
        delegationRole,
    };
};

/**
 * Creates a Route53 private hosted zone with VPC associations.
 *
 * @remarks
 * This construct creates a production-ready private hosted zone with:
 * - Association with a primary VPC
 * - Optional cross-region VPC associations
 * - Support for hybrid cloud DNS resolution
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Resources including the private hosted zone
 *
 * @example
 * ```typescript
 * import { createPrivateHostedZone } from '@cdk-constructs/route53';
 * import { Vpc } from 'aws-cdk-lib/aws-ec2';
 *
 * const vpc = Vpc.fromLookup(this, 'VPC', { vpcId: 'vpc-xxx' });
 *
 * const { hostedZone } = createPrivateHostedZone(this, {
 *   zoneName: 'internal.example.com',
 *   vpc,
 *   comment: 'Private DNS zone',
 * });
 *
 * // With cross-region VPC associations
 * const { hostedZone } = createPrivateHostedZone(this, {
 *   zoneName: 'internal.example.com',
 *   vpc,
 *   additionalVpcs: [
 *     { vpcId: 'vpc-yyy', region: 'us-west-2' },
 *     { vpcId: 'vpc-zzz', region: 'eu-west-1' },
 *   ],
 * });
 * ```
 *
 * @see {@link PrivateHostedZoneProps} for configuration options
 * @see https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-creating.html
 * @public
 */
export const createPrivateHostedZone = (scope: Construct, props: PrivateHostedZoneProps): PrivateHostedZoneResources => {
    const hostedZone = new PrivateHostedZone(scope, props.zoneName, {
        zoneName: props.zoneName,
        vpc: props.vpc,
        comment: props.comment,
    });

    // Apply removal policy if specified
    if (props.removalPolicy) {
        hostedZone.applyRemovalPolicy(props.removalPolicy);
    }

    // Associate additional VPCs if specified
    if (props.additionalVpcs && props.additionalVpcs.length > 0) {
        props.additionalVpcs.forEach((vpcConfig, index) => {
            const association = associateVpcWithHostedZone(scope, `${props.zoneName}-vpc-association-${index}`, {
                vpcId: vpcConfig.vpcId,
                hostedZoneId: hostedZone.hostedZoneId,
                region: vpcConfig.region,
                comment: `Associate VPC ${vpcConfig.vpcId} in ${vpcConfig.region}`,
            });

            association.association.node.addDependency(hostedZone);
        });
    }

    return {
        hostedZone,
    };
};

/**
 * Creates a cross-account zone delegation record.
 *
 * @remarks
 * This construct creates an NS record in a parent hosted zone to delegate
 * a subdomain to another hosted zone, potentially in a different AWS account.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns The delegation record
 *
 * @example
 * ```typescript
 * import { createSubdomainDelegation } from '@cdk-constructs/route53';
 *
 * const delegationRole = Role.fromRoleArn(
 *   this,
 *   'DelegationRole',
 *   'arn:aws:iam::123456789012:role/dns-delegation-role'
 * );
 *
 * createSubdomainDelegation(this, {
 *   delegatedZone: mySubdomainZone,
 *   parentHostedZoneId: 'Z1234567890ABC',
 *   delegationRoleArn: delegationRole.roleArn,
 * });
 * ```
 *
 * @see {@link SubdomainDelegationProps} for configuration options
 * @public
 */
export const createSubdomainDelegation = (scope: Construct, props: SubdomainDelegationProps): CrossAccountZoneDelegationRecord => {
    const delegationRole = Role.fromRoleArn(scope, `delegation-role-${props.delegatedZone.zoneName}`, props.delegationRoleArn);

    const nsRecord = new CrossAccountZoneDelegationRecord(scope, `delegation-record-${props.delegatedZone.zoneName}`, {
        delegatedZone: props.delegatedZone,
        parentHostedZoneId: props.parentHostedZoneId,
        delegationRole,
    });

    nsRecord.node.addDependency(delegationRole);
    nsRecord.node.addDependency(props.delegatedZone);

    return nsRecord;
};
