import {AuroraClusterBaseConfig} from './aurora-cluster-base';

/**
 * Configuration properties for Aurora PostgreSQL cluster.
 *
 * @remarks
 * This configuration allows you to specify any Aurora PostgreSQL engine version.
 * You are not forced to upgrade to specific versions - choose what works for your use case.
 *
 * @example
 * ```typescript
 * import {DatabaseClusterEngine, AuroraPostgresEngineVersion} from 'aws-cdk-lib/aws-rds';
 *
 * const config: AuroraPostgresClusterProps = {
 *   engine: DatabaseClusterEngine.auroraPostgres({
 *     version: AuroraPostgresEngineVersion.VER_16_4
 *   }),
 *   clusterName: 'my-postgres-cluster',
 *   vpc: myVpc,
 *   writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
 *   databaseName: 'mydb',
 *   clusterParameters: {
 *     name: 'my-cluster-params',
 *     engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
 *     description: 'Custom parameters',
 *   },
 *   instanceParameters: {
 *     name: 'my-instance-params',
 *     engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
 *     description: 'Instance parameters',
 *   },
 * };
 * ```
 *
 * @see {@link AuroraClusterBaseConfig} for all available configuration options
 * @public
 */
export type AuroraPostgresClusterProps = AuroraClusterBaseConfig;
