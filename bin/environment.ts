/**
 * Environment configuration re-exports.
 *
 * @remarks
 * This file re-exports environment configurations and types from their
 * organized locations for backwards compatibility.
 *
 * - Types are defined in lib/types/
 * - Configurations are defined in lib/config/
 */

import {ProjectEnvironment} from '../lib/types/project';
import {buildEnv, devEnv, prodEnv, stagingEnv} from '../lib/config/environments';
import {ResolvedAccounts} from '../lib/config/account-resolver';

export type {ProjectEnvironment} from '../lib/types/project';

/**
 * Integration test environments.
 *
 * @remarks
 * Add new environments and stack configurations here for testing.
 * Each environment can include optional stack-specific props.
 */
export const integrationEnvironments: ProjectEnvironment[] = [
    {
        ...buildEnv,
        codeArtifact: {
            codeArtifactDomainName: 'cdk-constructs',
            codeArtifactRepositoryName: 'cdk-constructs-library',
            codeArtifactRepositoryDescription: 'CDK Constructs Library Build Repository',
            allowedAccounts: [ResolvedAccounts.DEV, ResolvedAccounts.STAGING, ResolvedAccounts.PROD],
        },
    },
    {
        ...devEnv,
    },
    {
        ...stagingEnv,
    },
    {
        ...prodEnv,
    },
];
