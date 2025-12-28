import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createAuroraPostgresCluster} from '@cdk-constructs/aurora';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying Aurora PostgreSQL in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the Aurora PostgreSQL construct with a
 * configuration file pattern. For integration testing:
 * 1. Copy `examples/environments.local.ts.example` to `examples/config/environments.local.ts`
 * 2. Update the local file with your VPC and subnet IDs
 * 3. Create or reference a Secrets Manager secret for database credentials
 * 4. Update the secretName below to match your secret
 *
 * The local configuration will automatically override the placeholder values.
 */
export class AuroraPostgresDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Reference an existing secret for database credentials
        // You can create a secret in AWS Secrets Manager with:

        // Resolve configuration with local overrides (if environments.local.ts exists)
        const config = ConfigResolver.getPostgresDevConfig();

        const {cluster, secret} = createAuroraPostgresCluster(this, {
            ...config,
        });

        // Optional: Output the cluster endpoint
        // new CfnOutput(this, 'ClusterEndpoint', {
        //     value: cluster.clusterEndpoint.hostname,
        //     description: 'Aurora PostgreSQL cluster endpoint',
        // });
    }
}
