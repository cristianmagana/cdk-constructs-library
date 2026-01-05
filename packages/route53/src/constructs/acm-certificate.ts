import {Construct} from 'constructs';
import {CfnOutput, Stack} from 'aws-cdk-lib';
import {Certificate, CertificateValidation} from 'aws-cdk-lib/aws-certificatemanager';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from 'aws-cdk-lib/custom-resources';
import {AcmCertificateProps, AcmCertificateResources} from '../types/acm-certificate';

/**
 * Creates an ACM certificate with DNS validation.
 *
 * @remarks
 * This construct creates a production-ready ACM certificate with:
 * - Automatic DNS validation using Route53
 * - Support for multiple domains (SANs)
 * - Optional cross-region certificate for CloudFront (opt-in)
 * - CloudFormation outputs for certificate ARNs
 *
 * **Multi-Region Support (Opt-In)**:
 * By default, the certificate is created in the stack's region only.
 * Enable cross-region support for CloudFront distributions which require
 * certificates in us-east-1, regardless of where the distribution is created.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Resources including the certificate and optional cross-region certificate
 *
 * @example
 * ```typescript
 * import { createAcmCertificate } from '@cdk-constructs/route53';
 *
 * // Basic certificate in current region
 * const { certificate } = createAcmCertificate(this, {
 *   certificateName: 'example-cert',
 *   domainName: 'example.com',
 *   hostedZone: myHostedZone,
 *   subjectAlternativeNames: ['*.example.com'],
 * });
 *
 * // With cross-region support for CloudFront
 * const { certificate, crossRegionCertificate } = createAcmCertificate(this, {
 *   certificateName: 'cloudfront-cert',
 *   domainName: 'cdn.example.com',
 *   hostedZone: myHostedZone,
 *   subjectAlternativeNames: ['*.cdn.example.com'],
 *   enableCrossRegion: true,
 *   crossRegionConfig: {
 *     region: 'us-east-1',
 *     comment: 'Certificate for CloudFront distribution',
 *   },
 * });
 *
 * // Access cross-region certificate ARN
 * const crossRegionArn = crossRegionCertificate?.getResponseField('CertificateArn');
 * ```
 *
 * @see {@link AcmCertificateProps} for configuration options
 * @see https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html
 * @public
 */
export const createAcmCertificate = (scope: Construct, props: AcmCertificateProps): AcmCertificateResources => {
    // Create certificate in the stack's region
    const certificate = new Certificate(scope, props.certificateName, {
        certificateName: props.certificateName,
        domainName: props.domainName,
        subjectAlternativeNames: props.subjectAlternativeNames,
        validation: CertificateValidation.fromDns(props.hostedZone),
    });

    certificate.node.addDependency(props.hostedZone);

    // Create CloudFormation output for the certificate ARN
    const outputName = `${props.certificateName}-arn-${Stack.of(scope).region}`;
    new CfnOutput(scope, outputName, {
        value: certificate.certificateArn,
        description: `ACM Certificate ARN for ${props.domainName} in ${Stack.of(scope).region}`,
    });

    let crossRegionCertificate: AwsCustomResource | undefined;

    // Create cross-region certificate if enabled
    if (props.enableCrossRegion) {
        if (!props.crossRegionConfig) {
            throw new Error('crossRegionConfig must be provided when enableCrossRegion is true');
        }

        const {region, comment} = props.crossRegionConfig;

        // Create custom resource to request certificate in different region
        crossRegionCertificate = new AwsCustomResource(scope, `${props.certificateName}-cross-region`, {
            policy: AwsCustomResourcePolicy.fromStatements([
                new PolicyStatement({
                    actions: [
                        'acm:RequestCertificate',
                        'acm:DescribeCertificate',
                        'acm:DeleteCertificate',
                        'route53:GetChange',
                        'route53:ChangeResourceRecordSets',
                        'route53:ListResourceRecordSets',
                        'route53:ListHostedZones',
                    ],
                    resources: ['*'],
                }),
            ]),
            logRetention: RetentionDays.ONE_WEEK,
            onCreate: {
                service: 'ACM',
                action: 'requestCertificate',
                parameters: {
                    DomainName: props.domainName,
                    ValidationMethod: 'DNS',
                    SubjectAlternativeNames: props.subjectAlternativeNames || [],
                },
                region,
                physicalResourceId: PhysicalResourceId.of(`${props.certificateName}-${region}`),
            },
            installLatestAwsSdk: false,
        });

        crossRegionCertificate.node.addDependency(props.hostedZone);

        // Create CloudFormation output for cross-region certificate ARN
        const crossRegionOutputName = `${props.certificateName}-arn-${region}`;
        new CfnOutput(scope, crossRegionOutputName, {
            value: crossRegionCertificate.getResponseField('CertificateArn'),
            description: comment || `ACM Certificate ARN for ${props.domainName} in ${region}`,
        });
    }

    return {
        certificate,
        crossRegionCertificate,
    };
};
