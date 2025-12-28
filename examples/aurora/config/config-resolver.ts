import {AuroraMySqlClusterProps, AuroraPostgresClusterProps} from '@cdk-constructs/aurora';
import {MYSQL_DEV_CONFIG} from './aurora-mysql-dev';
import {MYSQL_PROD_CONFIG} from './aurora-mysql-prod';
import {POSTGRES_DEV_CONFIG} from './aurora-postgres-dev';
import {POSTGRES_PROD_CONFIG} from './aurora-postgres-prod';

/**
 * Local configuration interface for environment overrides.
 */
export interface LocalConfig {
    /**
     * VPC ID for integration testing.
     */
    vpcId: string;

    /**
     * Private subnet IDs for integration testing.
     */
    subnetIds: string[];
}

/**
 * Configuration resolver for Aurora examples.
 *
 * @remarks
 * This resolver implements a layered configuration approach:
 * 1. Base configuration (with placeholders) - Always loaded
 * 2. Local overrides (from environments.local.ts) - Optional, gitignored
 *
 * This allows:
 * - Opensource examples with safe placeholder values
 * - Local integration testing with real AWS resources
 * - No risk of committing sensitive resource IDs
 */
export class ConfigResolver {
    private static localConfig: LocalConfig | undefined;
    private static localConfigLoaded = false;

    /**
     * Loads local configuration overrides if available.
     *
     * @remarks
     * Attempts to import \`environments.local.ts\` which should export LOCAL_CONFIG.
     * If the file doesn't exist, returns undefined.
     * This method caches the result to avoid multiple file system checks.
     *
     * @returns Local configuration or undefined if not found
     */
    private static loadLocalConfig(): LocalConfig | undefined {
        if (!this.localConfigLoaded) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const {LOCAL_CONFIG} = require('../../environments.local');
                this.localConfig = LOCAL_CONFIG;
            } catch {
                // environments.local.ts doesn't exist, use placeholder values
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
     * If \`environments.local.ts\` exists, VPC and subnet IDs will be overridden.
     * All other configuration values remain unchanged.
     *
     * @param baseConfig - Base configuration with placeholder values
     * @returns Resolved configuration with local overrides applied (if available)
     */
    private static resolve<T extends {vpcId: string; subnetIds: string[]}>(baseConfig: T): T {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {
                ...baseConfig,
                vpcId: localConfig.vpcId,
                subnetIds: localConfig.subnetIds,
            };
        }
        return baseConfig;
    }

    /**
     * Resolves MySQL development configuration.
     *
     * @returns MySQL dev configuration with local overrides applied
     */
    public static getMySqlDevConfig(): AuroraMySqlClusterProps {
        return this.resolve(MYSQL_DEV_CONFIG);
    }

    /**
     * Resolves MySQL production configuration.
     *
     * @returns MySQL prod configuration with local overrides applied
     */
    public static getMySqlProdConfig(): AuroraMySqlClusterProps {
        return this.resolve(MYSQL_PROD_CONFIG);
    }

    /**
     * Resolves PostgreSQL development configuration.
     *
     * @returns PostgreSQL dev configuration with local overrides applied
     */
    public static getPostgresDevConfig(): AuroraPostgresClusterProps {
        return this.resolve(POSTGRES_DEV_CONFIG);
    }

    /**
     * Resolves PostgreSQL production configuration.
     *
     * @returns PostgreSQL prod configuration with local overrides applied
     */
    public static getPostgresProdConfig(): AuroraPostgresClusterProps {
        return this.resolve(POSTGRES_PROD_CONFIG);
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
