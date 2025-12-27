import {Account} from '@cdk-constructs/aws';

/**
 * Resolves AWS account IDs from local configuration or environment variables.
 *
 * @remarks
 * Resolution order:
 * 1. Environment variables (AWS_ACCOUNT_BUILD, AWS_ACCOUNT_DEV, etc.)
 * 2. Local accounts.local.ts file (gitignored)
 * 3. Public Account enum (placeholder values)
 *
 * This allows the project to be open source with placeholder account IDs
 * while using real account IDs during deployment.
 *
 * @internal
 */

/**
 * Resolved account IDs for deployment.
 *
 * @remarks
 * Uses real account IDs from accounts.local.ts if available,
 * otherwise falls back to environment variables or placeholders.
 */
export const ResolvedAccounts = {
    BUILD: resolveAccount('BUILD'),
    DEV: resolveAccount('DEV'),
    STAGING: resolveAccount('STAGING'),
    PROD: resolveAccount('PROD'),
};

/**
 * Resolves an account ID from available sources.
 *
 * @param env - The environment name (BUILD, DEV, STAGING, PROD)
 * @returns The resolved account ID
 *
 * @internal
 */
function resolveAccount(env: 'BUILD' | 'DEV' | 'STAGING' | 'PROD'): string {
    // 1. Try environment variable first (for CI/CD)
    const envVar = process.env[`AWS_ACCOUNT_${env}`];
    if (envVar) {
        console.log(`Using account ID from environment variable AWS_ACCOUNT_${env}`);
        return envVar;
    }

    // 2. Try loading from accounts.local.ts (gitignored, for local development)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {AccountLocal} = require('@cdk-constructs/aws/dist/src/accounts.local');
        const accountId = AccountLocal[env];
        if (accountId && accountId !== '000000000000') {
            console.log(`Using account ID from accounts.local.ts for ${env}`);
            return accountId;
        }
    } catch (error) {
        // accounts.local.ts doesn't exist or hasn't been built yet
        // This is expected in CI/CD or when the file hasn't been created yet
    }

    // 3. Fall back to public Account enum (placeholder values)
    console.warn(`WARNING: Using placeholder account ID for ${env}. ` + `Set AWS_ACCOUNT_${env} environment variable or configure accounts.local.ts`);
    return Account[env];
}
