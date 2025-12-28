import {EnvironmentConfig} from '@cdk-constructs/aws';
import {CodeArtifactStackProps} from '@cdk-constructs/codeartifact';
import {AuroraMySqlClusterProps, AuroraPostgresClusterProps} from '@cdk-constructs/aurora';

/**
 * Project environment configuration that includes all stack props.
 *
 * @example
 * ```typescript
 * const env: ProjectEnvironment = {
 *   account: Account.PROD,
 *   region: Region.US_EAST_1,
 *   name: Environment.PROD,
 *   owner: 'platform-team',
 *   codeArtifact: {
 *     codeArtifactDomainName: 'my-domain',
 *     codeArtifactRepositoryName: 'my-repo',
 *     codeArtifactRepositoryDescription: 'Production artifacts',
 *   },
 *   // Aurora MySQL cluster configuration
 *   auroraMySql: {
 *     clusterName: 'my-mysql-cluster',
 *     // ... other AuroraMySqlClusterProps
 *   },
 *   // Aurora PostgreSQL cluster configuration
 *   auroraPostgres: {
 *     clusterName: 'my-postgres-cluster',
 *     // ... other AuroraPostgresClusterProps
 *   },
 * };
 * ```
 *
 * @see {@link EnvironmentConfig} for base environment properties
 * @public
 */
export type ProjectEnvironment = EnvironmentConfig & {
    /** Optional CodeArtifact stack configuration. */
    codeArtifact?: CodeArtifactStackProps;

    /**
     * Optional Aurora MySQL cluster configuration.
     * If provided, an Aurora MySQL stack will be created for this environment.
     */
    auroraMySql?: Partial<AuroraMySqlClusterProps>;

    /**
     * Optional Aurora PostgreSQL cluster configuration.
     * If provided, an Aurora PostgreSQL stack will be created for this environment.
     */
    auroraPostgres?: Partial<AuroraPostgresClusterProps>;
};
