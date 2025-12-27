import {Region, Environment, EnvironmentConfig} from '@cdk-constructs/aws';
import {ResolvedAccounts} from './account-resolver';

/** Build environment configuration for CI/CD and artifact generation. @internal */
export const buildEnv: EnvironmentConfig = {
    account: ResolvedAccounts.BUILD,
    region: Region.US_EAST_1,
    name: Environment.BUILD,
    owner: 'platform-team',
};

/** Development environment configuration for active development and testing. @internal */
export const devEnv: EnvironmentConfig = {
    account: ResolvedAccounts.DEV,
    region: Region.US_EAST_1,
    name: Environment.DEV,
    owner: 'platform-team',
};

/** Staging environment configuration for pre-production testing and validation. @internal */
export const stagingEnv: EnvironmentConfig = {
    account: ResolvedAccounts.STAGING,
    region: Region.US_EAST_1,
    name: Environment.STAGING,
    owner: 'platform-team',
};

/** Production environment configuration for live production workloads. @internal */
export const prodEnv: EnvironmentConfig = {
    account: ResolvedAccounts.PROD,
    region: Region.US_EAST_1,
    name: Environment.PROD,
    owner: 'platform-team',
};
