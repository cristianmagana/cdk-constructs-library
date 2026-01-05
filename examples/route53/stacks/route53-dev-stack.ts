import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from 'aws-cdk-lib/aws-ec2';
import {createPublicHostedZone, createPrivateHostedZone, createResolverEndpoint, createAcmCertificate} from '@cdk-constructs/route53';
import {Route53ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying Route53 resources in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the Route53 construct with:
 * - Public hosted zone for external DNS
 * - Private hosted zone for internal DNS
 * - Route53 Resolver endpoint for hybrid cloud DNS
 * - ACM certificate with DNS validation
 * - Development-appropriate configuration
 * - Easy cleanup with destroy policy
 *
 * For integration testing:
 * 1. Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`
 * 2. Update the local file with your VPC ID and other resource IDs
 * 3. Deploy with `cdk deploy route53-dev`
 *
 * **Note**: This example uses placeholder VPC configuration. For actual deployment,
 * you must provide a real VPC ID via environments.local.ts or modify the stack
 * to use VPC lookup.
 */
export class Route53DevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Get configurations
        const publicZoneConfig = Route53ConfigResolver.getPublicZoneDevConfig();
        const privateZoneConfig = Route53ConfigResolver.getPrivateZoneDevConfig();
        const resolverConfig = Route53ConfigResolver.getResolverDevConfig();
        const vpcId = Route53ConfigResolver.getVpcId();

        // Create public hosted zone
        const {hostedZone: publicZone} = createPublicHostedZone(this, publicZoneConfig);

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
            description: 'Public hosted zone ID (check console for name servers)',
        });

        // Create ACM certificate for the public zone
        const {certificate} = createAcmCertificate(this, {
            certificateName: `${publicZoneConfig.zoneName}-cert`,
            domainName: publicZoneConfig.zoneName,
            hostedZone: publicZone,
            subjectAlternativeNames: [`*.${publicZoneConfig.zoneName}`],
        });

        new CfnOutput(this, 'CertificateArn', {
            value: certificate.certificateArn,
            description: 'ACM certificate ARN',
        });

        // Only create VPC-dependent resources if VPC ID is provided
        if (vpcId) {
            const vpc = Vpc.fromLookup(this, 'VPC', {vpcId});

            // Create private hosted zone
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
        } else {
            new CfnOutput(this, 'VpcWarning', {
                value: 'VPC ID not provided - private zone and resolver endpoint not created',
                description: 'Configure VPC ID in environments.local.ts to create VPC-dependent resources',
            });
        }
    }
}
