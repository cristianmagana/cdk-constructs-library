import {EnvironmentConfig} from '@cdk-constructs/aws';
import {CodeArtifactStackProps} from '@cdk-constructs/codeartifact';

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
 * };
 * ```
 *
 * @see {@link EnvironmentConfig} for base environment properties
 * @public
 */
export type ProjectEnvironment = EnvironmentConfig & {
    /** Optional CodeArtifact stack configuration. */
    codeArtifact?: CodeArtifactStackProps;
};
