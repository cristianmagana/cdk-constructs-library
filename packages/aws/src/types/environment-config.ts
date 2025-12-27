import {Region} from '../enums/region';
import {Environment} from '../enums/environment';

/**
 * Environment configuration type for CDK stacks.
 *
 * @example
 * ```typescript
 * const devConfig: EnvironmentConfig = {
 *   account: '123456789012',
 *   region: Region.US_EAST_1,
 *   name: Environment.DEV,
 *   owner: 'platform-team',
 * };
 * ```
 *
 * @public
 */
export type EnvironmentConfig = {
    /** AWS Account ID for this environment. */
    account: string;

    /** AWS Region for this environment. */
    region: Region;

    /** Environment name (dev, staging, prod) for resource naming and tagging. */
    name: Environment;

    /** Owner of this environment for resource tagging and ownership tracking. */
    owner: string;
};
