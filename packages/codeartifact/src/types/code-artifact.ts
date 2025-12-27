import {CfnTag} from 'aws-cdk-lib';

/**
 * Properties for creating a CodeArtifact domain.
 *
 * @example
 * ```typescript
 * const props: CodeArtifactDomainProps = {
 *   domainName: 'my-domain',
 *   allowedAccounts: [Account.BUILD, Account.DEV],
 * };
 * ```
 *
 * @public
 */
export type CodeArtifactDomainProps = {
    /** The name of the CodeArtifact domain. */
    domainName: string;

    /** Optional tags to apply to the domain. */
    tags?: CfnTag[];

    /** AWS account IDs allowed to get authorization tokens. @defaultValue All accounts */
    allowedAccounts?: string[];
};

/**
 * Properties for creating a CodeArtifact repository.
 *
 * @example
 * ```typescript
 * const props: CodeArtifactRepositoryProps = {
 *   domainName: 'my-domain',
 *   repositoryName: 'my-repo',
 *   repositoryDescription: 'Private npm packages',
 *   allowedAccounts: [Account.BUILD, Account.DEV],
 * };
 * ```
 *
 * @public
 */
export type CodeArtifactRepositoryProps = {
    /** The name of the CodeArtifact repository. */
    repositoryName: string;

    /** The description of the CodeArtifact repository. */
    repositoryDescription: string;

    /** The name of the CodeArtifact domain this repository belongs to. */
    domainName: string;

    /** Optional tags to apply to the repository. */
    tags?: CfnTag[];

    /** AWS account IDs allowed to access the repository. @defaultValue All accounts */
    allowedAccounts?: string[];
};

/**
 * Properties for creating a CodeArtifact stack.
 *
 * @example
 * ```typescript
 * const props: CodeArtifactStackProps = {
 *   codeArtifactDomainName: 'my-domain',
 *   codeArtifactRepositoryName: 'my-repo',
 *   codeArtifactRepositoryDescription: 'Build artifacts',
 *   allowedAccounts: [Account.BUILD, Account.DEV],
 * };
 * ```
 *
 * @see {@link EnvironmentConfig} for environment configuration
 * @public
 */
export type CodeArtifactStackProps = {
    /** The CodeArtifact domain name. */
    codeArtifactDomainName: string;

    /** The CodeArtifact repository name. */
    codeArtifactRepositoryName: string;

    /** The CodeArtifact repository description. */
    codeArtifactRepositoryDescription: string;

    /** Optional tags to apply to CodeArtifact resources. */
    codeArtifactTags?: CfnTag[];

    /** AWS account IDs allowed to access CodeArtifact resources. @defaultValue All accounts */
    allowedAccounts?: string[];
};
