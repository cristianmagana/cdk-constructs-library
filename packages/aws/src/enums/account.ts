/**
 * AWS Account ID enumeration with example account IDs.
 *
 * This enum provides a centralized way to reference AWS account IDs
 * used across different environments and regions.
 *
 * **Note:** These are example account IDs for demonstration purposes.
 * For your actual AWS account IDs, create a `accounts.local.ts` file
 * and import `AccountLocal` instead.
 *
 * @example
 * ```typescript
 * import { Account } from '@cdk-constructs/aws';
 *
 * const accountId = Account.PROD;
 * ```
 *
 * @public
 */
export enum Account {
    /**
     * Build account ID (example).
     *
     * @remarks
     * Isolated account for CI/CD pipelines, artifact generation,
     * and software supply chain security. Other environments can
     * access this account in readonly/immutable mode only.
     * Example ID: Replace with your actual build account.
     */
    BUILD = '000000000000',

    /**
     * Development account ID (example).
     *
     * @remarks
     * This account is used for active development and testing.
     * Example ID: Replace with your actual dev account.
     */
    DEV = '111111111111',

    /**
     * Staging account ID (example).
     *
     * @remarks
     * This account is used for pre-production testing and validation.
     * Example ID: Replace with your actual staging account.
     */
    STAGING = '222222222222',

    /**
     * Production account ID (example).
     *
     * @remarks
     * This account is used for production workloads and should have
     * strict security and compliance controls.
     * Example ID: Replace with your actual production account.
     */
    PROD = '333333333333',
}
