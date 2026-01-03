import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createS3Bucket} from '@cdk-constructs/s3';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying an S3 bucket in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the S3 bucket construct with:
 * - Lifecycle rules for automatic cost optimization
 * - Versioning enabled for data protection
 * - Destroy removal policy for easy cleanup in dev
 *
 * The bucket is configured with lifecycle transitions to:
 * - Infrequent Access after 30 days
 * - Glacier after 90 days
 */
export class S3DevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Resolve configuration
        const config = ConfigResolver.getS3DevConfig();

        const bucket = createS3Bucket(this, {
            ...config,
        });

        // Output the bucket name and ARN
        new CfnOutput(this, 'BucketName', {
            value: bucket.bucketName,
            description: 'S3 bucket name',
        });

        new CfnOutput(this, 'BucketArn', {
            value: bucket.bucketArn,
            description: 'S3 bucket ARN',
        });
    }
}
