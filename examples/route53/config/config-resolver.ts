import {PublicHostedZoneProps, PrivateHostedZoneProps, ResolverEndpointProps} from '@cdk-constructs/route53';
import {PUBLIC_ZONE_DEV_CONFIG, PRIVATE_ZONE_DEV_CONFIG, RESOLVER_DEV_CONFIG} from './route53-dev';
import {PUBLIC_ZONE_PROD_CONFIG, PRIVATE_ZONE_PROD_CONFIG, RESOLVER_PROD_CONFIG} from './route53-prod';

/**
 * Local configuration interface for environment overrides.
 *
 * @remarks
 * Create `examples/environments.local.ts` (gitignored) to override these values
 * for local testing and deployment.
 */
export interface LocalRoute53Config {
    /**
     * VPC ID for private hosted zone and resolver endpoint.
     */
    vpcId?: string;

    /**
     * Additional VPC configurations for cross-region associations.
     */
    additionalVpcs?: Array<{
        vpcId: string;
        region: string;
    }>;

    /**
     * Override the public zone name for testing.
     */
    publicZoneName?: string;

    /**
     * Override the private zone name for testing.
     */
    privateZoneName?: string;
}

/**
 * Configuration resolver for Route53 examples.
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
export class Route53ConfigResolver {
    private static localConfig: LocalRoute53Config | undefined;
    private static localConfigLoaded = false;

    private static loadLocalConfig(): LocalRoute53Config | undefined {
        if (!this.localConfigLoaded) {
            try {
                const {LOCAL_ROUTE53_CONFIG} = require('../../environments.local');
                this.localConfig = LOCAL_ROUTE53_CONFIG;
            } catch {
                this.localConfig = undefined;
            }
            this.localConfigLoaded = true;
        }
        return this.localConfig;
    }

    private static resolve<T extends LocalRoute53Config>(baseConfig: T): T {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {...baseConfig, ...localConfig};
        }
        return baseConfig;
    }

    public static getPublicZoneDevConfig(): PublicHostedZoneProps {
        const localConfig = this.loadLocalConfig();
        return {
            ...PUBLIC_ZONE_DEV_CONFIG,
            ...(localConfig?.publicZoneName ? {zoneName: localConfig.publicZoneName} : {}),
        };
    }

    public static getPublicZoneProdConfig(): PublicHostedZoneProps {
        const localConfig = this.loadLocalConfig();
        return {
            ...PUBLIC_ZONE_PROD_CONFIG,
            ...(localConfig?.publicZoneName ? {zoneName: localConfig.publicZoneName} : {}),
        };
    }

    public static getPrivateZoneDevConfig(): Omit<PrivateHostedZoneProps, 'vpc'> {
        const localConfig = this.loadLocalConfig();
        return {
            ...PRIVATE_ZONE_DEV_CONFIG,
            ...(localConfig?.privateZoneName ? {zoneName: localConfig.privateZoneName} : {}),
            ...(localConfig?.additionalVpcs ? {additionalVpcs: localConfig.additionalVpcs} : {}),
        };
    }

    public static getPrivateZoneProdConfig(): Omit<PrivateHostedZoneProps, 'vpc'> {
        const localConfig = this.loadLocalConfig();
        return {
            ...PRIVATE_ZONE_PROD_CONFIG,
            ...(localConfig?.privateZoneName ? {zoneName: localConfig.privateZoneName} : {}),
            ...(localConfig?.additionalVpcs ? {additionalVpcs: localConfig.additionalVpcs} : {}),
        };
    }

    public static getResolverDevConfig(): Omit<ResolverEndpointProps, 'vpc'> {
        return RESOLVER_DEV_CONFIG;
    }

    public static getResolverProdConfig(): Omit<ResolverEndpointProps, 'vpc'> {
        return RESOLVER_PROD_CONFIG;
    }

    public static getVpcId(): string | undefined {
        const localConfig = this.loadLocalConfig();
        return localConfig?.vpcId;
    }

    public static hasLocalConfig(): boolean {
        return this.loadLocalConfig() !== undefined;
    }
}
