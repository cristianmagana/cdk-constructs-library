import {Distribution} from 'aws-cdk-lib/aws-cloudfront';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {BucketProps} from '@cdk-constructs/s3';
import {CloudFrontProps, Route53Props} from './cloudfront-base';

/**
 * Properties for creating a CloudFront distribution with an S3 bucket origin.
 *
 * @remarks
 * This configuration creates a complete CloudFront + S3 setup including:
 * - S3 bucket for static content
 * - S3 bucket for CloudFront access logs
 * - CloudFront distribution with Origin Access Control
 * - Optional Route 53 A-record for custom domain
 *
 * @public
 */
export type CloudFrontS3Props = {
    /** Route 53 DNS configuration */
    route53: Route53Props;

    /** CloudFront distribution configuration */
    cloudfront: CloudFrontProps;

    /** S3 bucket configuration for static content */
    s3: BucketProps;
};

/**
 * Resources created by the CloudFront + S3 construct.
 *
 * @public
 */
export type CloudFrontS3Resources = {
    /** The CloudFront distribution */
    distribution: Distribution;

    /** The S3 bucket for static content */
    contentBucket: Bucket;

    /** The S3 bucket for CloudFront logs */
    logBucket: Bucket;
};
