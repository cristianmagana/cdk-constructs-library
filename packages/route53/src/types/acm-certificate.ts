import {IHostedZone} from 'aws-cdk-lib/aws-route53';
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager';
import {AwsCustomResource} from 'aws-cdk-lib/custom-resources';

/**
 * Configuration for creating an ACM certificate with DNS validation.
 *
 * @remarks
 * Creates a DNS-validated certificate in AWS Certificate Manager.
 * The certificate will be automatically validated using Route53 DNS records.
 *
 * @public
 */
export type AcmCertificateProps = {
    /**
     * Name for the certificate.
     *
     * @remarks
     * This will be used for resource naming and as the certificate name in ACM.
     *
     * @example
     * ```typescript
     * certificateName: 'example-cert'
     * ```
     */
    certificateName: string;

    /**
     * The primary domain name for the certificate.
     *
     * @example
     * ```typescript
     * domainName: 'example.com'
     * ```
     */
    domainName: string;

    /**
     * The hosted zone used for DNS validation.
     *
     * @remarks
     * The certificate will create validation records in this zone.
     * The zone must contain the domain name.
     */
    hostedZone: IHostedZone;

    /**
     * Subject Alternative Names (SANs) for the certificate.
     *
     * @remarks
     * Additional domain names to include in the certificate.
     * Typically includes the wildcard variant.
     *
     * @example
     * ```typescript
     * subjectAlternativeNames: ['*.example.com', 'www.example.com']
     * ```
     */
    subjectAlternativeNames?: string[];

    /**
     * Enable cross-region certificate creation.
     *
     * @remarks
     * When enabled, creates an additional certificate in a different region
     * using a custom resource. This is useful for CloudFront distributions
     * which require certificates in us-east-1.
     *
     * **IMPORTANT**: This is opt-in. Only enable if you need multi-region support.
     *
     * @defaultValue false
     */
    enableCrossRegion?: boolean;

    /**
     * Configuration for the cross-region certificate.
     *
     * @remarks
     * Required when enableCrossRegion is true.
     */
    crossRegionConfig?: {
        /**
         * AWS region for the cross-region certificate.
         *
         * @example
         * ```typescript
         * region: 'us-east-1'
         * ```
         */
        region: string;

        /**
         * Comment for the cross-region certificate.
         */
        comment?: string;
    };
};

/**
 * Resources created by the ACM certificate construct.
 *
 * @public
 */
export type AcmCertificateResources = {
    /**
     * The ACM certificate in the stack's region.
     */
    certificate: ICertificate;

    /**
     * The cross-region certificate custom resource.
     *
     * @remarks
     * Only present when enableCrossRegion is true.
     * Use `getResponseField('CertificateArn')` to get the ARN.
     */
    crossRegionCertificate?: AwsCustomResource;
};
