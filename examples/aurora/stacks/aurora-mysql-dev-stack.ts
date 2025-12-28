import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createAuroraMySqlCluster} from '@cdk-constructs/aurora';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying Aurora MySQL in a development environment.
 *
 * @remarks
 * This stack demonstrates how to use the Aurora MySQL construct with a
 * configuration file pattern. For integration testing:
 * 1. Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`
 * 2. Update the local file with your VPC and subnet IDs
 * 3. Deploy! The construct automatically creates a Secrets Manager secret for credentials.
 *
 * The local configuration will automatically override the placeholder values.
 */
export class AuroraMySqlDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Resolve configuration with local overrides (if environments.local.ts exists)
        const config = ConfigResolver.getMySqlDevConfig();

        const {cluster, secret} = createAuroraMySqlCluster(this, {
            ...config,
        });

        // Optional: Output the cluster endpoint and secret ARN
        // new CfnOutput(this, 'ClusterEndpoint', {
        //     value: cluster.clusterEndpoint.hostname,
        //     description: 'Aurora MySQL cluster endpoint',
        // });
        //
        // new CfnOutput(this, 'SecretArn', {
        //     value: secret.secretArn,
        //     description: 'Secrets Manager secret containing database credentials',
        // });
    }
}
