import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from 'aws-cdk-lib/aws-ec2';
import {createPublicHostedZone, createPrivateHostedZone, createResolverEndpoint, createAcmCertificate} from '@cdk-constructs/route53';
import {Route53ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying Route53 resources in a production environment.
 *
 * @remarks
 * This stack demonstrates how to use the Route53 construct with:
 * - Public hosted zone with cross-account delegation
 * - Private hosted zone with cross-region VPC associations
 * - Route53 Resolver endpoint for hybrid cloud DNS
 * - ACM certificate with optional cross-region support
 * - Production-grade configuration
 * - Retain removal policy to prevent accidental deletion
 *
 * **Production Considerations**:
 * - Hosted zones have RETAIN policy - they will not be deleted with the stack
 * - Cross-account delegation enabled for subdomain management
 * - Cross-region VPC associations supported
 * - High availability resolver endpoint across 3 subnets
 */
export class Route53ProdStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Get configurations
        const publicZoneConfig = Route53ConfigResolver.getPublicZoneProdConfig();
        const privateZoneConfig = Route53ConfigResolver.getPrivateZoneProdConfig();
        const resolverConfig = Route53ConfigResolver.getResolverProdConfig();
        const vpcId = Route53ConfigResolver.getVpcId();

        // Create public hosted zone with cross-account delegation
        const {hostedZone: publicZone, delegationRole} = createPublicHostedZone(this, publicZoneConfig);

        new CfnOutput(this, 'PublicZoneId', {
            value: publicZone.hostedZoneId,
            description: 'Public hosted zone ID',
        });

        new CfnOutput(this, 'PublicZoneName', {
            value: publicZone.zoneName,
            description: 'Public hosted zone name',
        });

        // Note: Name servers are tokens and cannot be joined directly
        new CfnOutput(this, 'PublicZoneNameServers', {
            value: publicZone.hostedZoneId, // Output zone ID instead, name servers visible in console
            description: 'Public hosted zone ID (check AWS console for name servers to use in domain registration)',
        });

        if (delegationRole) {
            new CfnOutput(this, 'DelegationRoleArn', {
                value: delegationRole.roleArn,
                description: 'Cross-account delegation role ARN - use this for subdomain delegation',
            });
        }

        // Create ACM certificate for the public zone
        // For CloudFront, you can enable cross-region by uncommenting below
        const {certificate} = createAcmCertificate(this, {
            certificateName: `${publicZoneConfig.zoneName}-cert`,
            domainName: publicZoneConfig.zoneName,
            hostedZone: publicZone,
            subjectAlternativeNames: [`*.${publicZoneConfig.zoneName}`],
            // Uncomment for CloudFront distributions (requires us-east-1 certificate)
            // enableCrossRegion: true,
            // crossRegionConfig: {
            //     region: 'us-east-1',
            //     comment: 'Certificate for CloudFront distribution',
            // },
        });

        new CfnOutput(this, 'CertificateArn', {
            value: certificate.certificateArn,
            description: 'ACM certificate ARN',
        });

        // Only create VPC-dependent resources if VPC ID is provided
        if (vpcId) {
            const vpc = Vpc.fromLookup(this, 'VPC', {vpcId});

            // Create private hosted zone with cross-region VPC associations
            const {hostedZone: privateZone} = createPrivateHostedZone(this, {
                ...privateZoneConfig,
                vpc,
            });

            new CfnOutput(this, 'PrivateZoneId', {
                value: privateZone.hostedZoneId,
                description: 'Private hosted zone ID',
            });

            new CfnOutput(this, 'PrivateZoneName', {
                value: privateZone.zoneName,
                description: 'Private hosted zone name',
            });

            // Create resolver endpoint
            const {endpoint} = createResolverEndpoint(this, {
                ...resolverConfig,
                vpc,
            });

            new CfnOutput(this, 'ResolverEndpointId', {
                value: endpoint.ref,
                description: 'Route53 Resolver endpoint ID',
            });

            new CfnOutput(this, 'ResolverEndpointIpAddresses', {
                value: 'Check AWS Console for IP addresses',
                description: 'Resolver endpoint IP addresses - configure these in your on-premises DNS',
            });
        } else {
            new CfnOutput(this, 'VpcWarning', {
                value: 'VPC ID not provided - private zone and resolver endpoint not created',
                description: 'Configure VPC ID in environments.local.ts to create VPC-dependent resources',
            });
        }
    }
}
