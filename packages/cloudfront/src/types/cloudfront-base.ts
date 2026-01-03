import {Duration} from 'aws-cdk-lib';
import {DistributionProps} from 'aws-cdk-lib/aws-cloudfront';

/**
 * Error response configuration for CloudFront distributions.
 *
 * @remarks
 * Configures how CloudFront handles HTTP error responses from the origin.
 *
 * @public
 */
export type ErrorResponseProps = {
    /** HTTP status code to match */
    httpStatus: number;

    /** Path to the custom error page */
    responsePagePath: string;

    /** HTTP status code to return to the viewer */
    responseHttpStatus: number;

    /** TTL for caching the error response */
    ttl: Duration;
};

/**
 * CloudFront distribution configuration properties.
 *
 * @remarks
 * Extends standard CDK DistributionProps with additional configuration options
 * specific to S3-backed distributions.
 *
 * @public
 */
export type CloudFrontProps = Omit<DistributionProps, 'defaultBehavior'> & {
    /** Name of the S3 bucket for CloudFront logs */
    logBucketName: string;

    /** Logical name for the CloudFront distribution */
    distributionName: string;

    /** Optional ACM certificate ARN for HTTPS */
    certificateArn?: string;

    /** Optional S3 bucket name for additional config files */
    configBucketName?: string;

    /** Optional path within the config bucket */
    configBucketPath?: string;

    /** Optional custom error responses */
    errorResponses?: ErrorResponseProps[];
};

/**
 * Route 53 integration properties for CloudFront distributions.
 *
 * @remarks
 * Configures automatic DNS record creation for custom domains.
 *
 * @public
 */
export type Route53Props = {
    /** Enable Route 53 A-record creation */
    enableR53Lookup: boolean;

    /** Optional custom A-record address (subdomain) */
    aRecordAddress?: string;

    /** Optional Route 53 hosted zone ID */
    hostedZoneId?: string;

    /** Optional domain name for the hosted zone */
    domainName?: string;
};
