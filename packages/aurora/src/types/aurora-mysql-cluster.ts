import {AuroraClusterBaseConfig} from './aurora-cluster-base';

/**
 * Configuration properties for Aurora MySQL cluster.
 *
 * @remarks
 * This configuration allows you to specify any Aurora MySQL engine version.
 * You are not forced to upgrade to specific versions - choose what works for your use case.
 *
 * @example
 * ```typescript
 * import {DatabaseClusterEngine, AuroraMysqlEngineVersion} from 'aws-cdk-lib/aws-rds';
 *
 * const config: AuroraMySqlClusterProps = {
 *   engine: DatabaseClusterEngine.auroraMysql({
 *     version: AuroraMysqlEngineVersion.VER_3_09_0
 *   }),
 *   clusterName: 'my-mysql-cluster',
 *   vpc: myVpc,
 *   writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
 *   databaseName: 'mydb',
 *   clusterParameters: {
 *     name: 'my-cluster-params',
 *     engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
 *     description: 'Custom parameters',
 *   },
 *   instanceParameters: {
 *     name: 'my-instance-params',
 *     engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
 *     description: 'Instance parameters',
 *   },
 * };
 * ```
 *
 * @see {@link AuroraClusterBaseConfig} for all available configuration options
 * @public
 */
export type AuroraMySqlClusterProps = AuroraClusterBaseConfig;
