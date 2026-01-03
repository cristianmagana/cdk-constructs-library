import {BucketProps} from '@cdk-constructs/s3';
import {S3_DEV_CONFIG} from './s3-dev';
import {S3_PROD_CONFIG} from './s3-prod';

/**
 * Configuration resolver for S3 examples.
 *
 * @remarks
 * This resolver provides environment-specific S3 bucket configurations.
 * Unlike Aurora, S3 buckets don't require VPC/subnet overrides since they're
 * managed AWS services accessed via HTTPS endpoints.
 */
export class ConfigResolver {
    /**
     * Resolves S3 development configuration.
     *
     * @returns S3 dev configuration
     */
    public static getS3DevConfig(): BucketProps {
        return S3_DEV_CONFIG;
    }

    /**
     * Resolves S3 production configuration.
     *
     * @returns S3 prod configuration
     */
    public static getS3ProdConfig(): BucketProps {
        return S3_PROD_CONFIG;
    }
}
