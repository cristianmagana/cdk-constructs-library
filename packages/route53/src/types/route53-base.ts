import {RemovalPolicy} from 'aws-cdk-lib';
import {IHostedZone} from 'aws-cdk-lib/aws-route53';

/**
 * Base configuration for Route53 resources.
 *
 * @public
 */
export type Route53BaseConfig = {
    /**
     * Comment to describe the resource.
     *
     * @remarks
     * This comment will be visible in the AWS Console and CloudFormation.
     */
    comment?: string;

    /**
     * Removal policy for the resource.
     *
     * @remarks
     * - DESTROY: Resource will be deleted when the stack is deleted (default for dev)
     * - RETAIN: Resource will be retained when the stack is deleted (recommended for prod)
     * - SNAPSHOT: Not applicable for Route53 resources
     *
     * @defaultValue RemovalPolicy.DESTROY
     */
    removalPolicy?: RemovalPolicy;
};

/**
 * Base resources returned by Route53 construct functions.
 *
 * @public
 */
export type Route53BaseResources = {
    /**
     * The hosted zone created or used.
     */
    hostedZone?: IHostedZone;
};
