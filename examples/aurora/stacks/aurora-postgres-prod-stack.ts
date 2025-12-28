import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createAuroraPostgresCluster} from '@cdk-constructs/aurora';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Example stack for deploying Aurora PostgreSQL in a production environment.
 *
 * @remarks
 * This stack demonstrates production-ready Aurora PostgreSQL deployment with:
 * - Customer-managed KMS encryption
 * - Deletion protection
 * - Advanced monitoring
 * - Read replicas for high availability
 * - Optimized PostgreSQL parameters for production workloads
 *
 * For integration testing:
 * 1. Copy `examples/environments.local.ts.example` to `examples/config/environments.local.ts`
 * 2. Update the local file with your VPC and subnet IDs
 * 3. Deploy! The construct automatically creates a Secrets Manager secret for credentials.
 * 4. Update the secretName below to match your secret
 * 4. Review all security settings in the config file
 *
 * The local configuration will automatically override the placeholder values.
 */
export class AuroraPostgresProdStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Reference an existing secret for database credentials
        // For production, use a strong password and restrict access to this secret

        // Resolve configuration with local overrides (if environments.local.ts exists)
        const config = ConfigResolver.getPostgresProdConfig();

        const {cluster, secret} = createAuroraPostgresCluster(this, {
            ...config,
        });

        // Optional: Output the cluster endpoints
        // new CfnOutput(this, 'ClusterWriterEndpoint', {
        //     value: cluster.clusterEndpoint.hostname,
        //     description: 'Aurora PostgreSQL cluster writer endpoint',
        // });
        //
        // new CfnOutput(this, 'ClusterReaderEndpoint', {
        //     value: cluster.clusterReadEndpoint.hostname,
        //     description: 'Aurora PostgreSQL cluster reader endpoint',
        // });
    }
}
