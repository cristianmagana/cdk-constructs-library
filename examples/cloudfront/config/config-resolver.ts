import {CloudFrontS3Props} from '@cdk-constructs/cloudfront';
import {CLOUDFRONT_DEV_CONFIG} from './cloudfront-dev';
import {CLOUDFRONT_PROD_CONFIG} from './cloudfront-prod';

/**
 * Local configuration interface for CloudFront environment overrides.
 */
export interface LocalConfig {
    /**
     * Optional ACM certificate ARN for HTTPS (must be in us-east-1).
     */
    certificateArn?: string;

    /**
     * Optional domain names for the CloudFront distribution.
     */
    domainNames?: string[];

    /**
     * Optional Route 53 hosted zone ID.
     */
    hostedZoneId?: string;

    /**
     * Optional domain name for Route 53 hosted zone.
     */
    domainName?: string;

    /**
     * Optional A-record address (subdomain).
     */
    aRecordAddress?: string;
}

/**
 * Configuration resolver for CloudFront examples.
 *
 * @remarks
 * This resolver implements a layered configuration approach:
 * 1. Base configuration (with placeholders) - Always loaded
 * 2. Local overrides (from environments.local.ts) - Optional, gitignored
 *
 * This allows:
 * - Opensource examples that work without custom domains
 * - Local integration testing with real domains and certificates
 * - No risk of committing sensitive resource IDs
 */
export class ConfigResolver {
    private static localConfig: LocalConfig | undefined;
    private static localConfigLoaded = false;

    /**
     * Loads local configuration overrides if available.
     *
     * @remarks
     * Attempts to import \`environments.local.ts\` which should export LOCAL_CLOUDFRONT_CONFIG.
     * If the file doesn't exist, returns undefined.
     * This method caches the result to avoid multiple file system checks.
     *
     * @returns Local configuration or undefined if not found
     */
    private static loadLocalConfig(): LocalConfig | undefined {
        if (!this.localConfigLoaded) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const {LOCAL_CLOUDFRONT_CONFIG} = require('../../environments.local');
                this.localConfig = LOCAL_CLOUDFRONT_CONFIG;
            } catch {
                // environments.local.ts doesn't exist, use default values
                this.localConfig = undefined;
            }
            this.localConfigLoaded = true;
        }
        return this.localConfig;
    }

    /**
     * Resolves configuration by merging base config with local overrides.
     *
     * @remarks
     * If \`environments.local.ts\` exists, certificate, domain, and Route 53 values
     * will be overridden. All other configuration values remain unchanged.
     *
     * @param baseConfig - Base configuration with placeholder values
     * @returns Resolved configuration with local overrides applied (if available)
     */
    private static resolve(baseConfig: CloudFrontS3Props): CloudFrontS3Props {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {
                ...baseConfig,
                cloudfront: {
                    ...baseConfig.cloudfront,
                    ...(localConfig.certificateArn && {certificateArn: localConfig.certificateArn}),
                    ...(localConfig.domainNames && {domainNames: localConfig.domainNames}),
                },
                route53: {
                    ...baseConfig.route53,
                    ...(localConfig.hostedZoneId && {
                        enableR53Lookup: true,
                        hostedZoneId: localConfig.hostedZoneId,
                    }),
                    ...(localConfig.domainName && {domainName: localConfig.domainName}),
                    ...(localConfig.aRecordAddress && {aRecordAddress: localConfig.aRecordAddress}),
                },
            };
        }
        return baseConfig;
    }

    /**
     * Resolves CloudFront development configuration.
     *
     * @returns CloudFront dev configuration with local overrides applied
     */
    public static getCloudFrontDevConfig(): CloudFrontS3Props {
        return this.resolve(CLOUDFRONT_DEV_CONFIG);
    }

    /**
     * Resolves CloudFront production configuration.
     *
     * @returns CloudFront prod configuration with local overrides applied
     */
    public static getCloudFrontProdConfig(): CloudFrontS3Props {
        return this.resolve(CLOUDFRONT_PROD_CONFIG);
    }

    /**
     * Checks if local configuration is available.
     *
     * @returns True if environments.local.ts exists and was loaded successfully
     */
    public static hasLocalConfig(): boolean {
        return this.loadLocalConfig() !== undefined;
    }
}
