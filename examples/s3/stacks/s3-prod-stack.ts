import {Stack, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createS3Bucket} from '@cdk-constructs/s3';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying an S3 bucket in a production environment.
 *
 * @remarks
 * This stack demonstrates how to use the S3 bucket construct with:
 * - Intelligent Tiering for automatic cost optimization
 * - Versioning enabled for data protection
 * - Retain removal policy to prevent accidental deletion
 * - Archive tiers for long-term storage
 *
 * The bucket is configured with intelligent tiering that automatically moves
 * objects between access tiers based on access patterns, with archive tiers
 * for objects that haven't been accessed for extended periods.
 */
export class S3ProdStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Resolve configuration
        const config = ConfigResolver.getS3ProdConfig();

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
