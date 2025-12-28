import {Construct} from 'constructs';
import {CaCertificate, ClusterInstance, IClusterInstance, IClusterEngine, ParameterGroup} from 'aws-cdk-lib/aws-rds';
import {IVpc, SecurityGroup, Peer, Port} from 'aws-cdk-lib/aws-ec2';
import {RemovalPolicy} from 'aws-cdk-lib';
import {AuroraMySqlClusterProps} from '../types/aurora-mysql-cluster';
import {AuroraPostgresClusterProps} from '../types/aurora-postgres-cluster';

/**
 * RDS CA certificate to use for cluster connections.
 *
 * @public
 */
export const caCertificate = CaCertificate.RDS_CA_RSA2048_G1;

/**
 * Extracts a clean version string from the cluster engine.
 *
 * @param engine - The cluster engine
 * @returns Version string like "3-09" or "16-4"
 *
 * @internal
 */
const getEngineVersion = (engine: IClusterEngine): string => {
    // Engine version is in format like "3.09.0" or "16.4"
    // We want to extract major and minor for the parameter group name
    const versionMatch = engine.engineVersion?.fullVersion?.match(/^(\d+)\.(\d+)/);
    if (versionMatch) {
        return `${versionMatch[1]}-${versionMatch[2]}`;
    }
    return 'unknown';
};

/**
 * Gets the engine family name (aurora-mysql or aurora-postgresql).
 *
 * @param engine - The cluster engine
 * @returns Engine family like "aurora-mysql" or "aurora-postgresql"
 *
 * @internal
 */
const getEngineFamily = (engine: IClusterEngine): string => {
    const engineType = engine.engineType || '';
    if (engineType.includes('aurora-mysql')) {
        return 'aurora-mysql';
    } else if (engineType.includes('aurora-postgresql') || engineType.includes('aurora-postgres')) {
        return 'aurora-postgresql';
    }
    return engineType;
};

/**
 * Creates a parameter group for Aurora cluster.
 *
 * @param scope - The construct scope
 * @param props - Cluster configuration properties
 * @returns The created parameter group
 *
 * @example
 * ```typescript
 * const paramGroup = createClusterParameterGroup(this, props);
 * ```
 *
 * @public
 */
export const createClusterParameterGroup = (scope: Construct, props: AuroraMySqlClusterProps | AuroraPostgresClusterProps): ParameterGroup => {
    const engine = props.clusterParameters?.engine ?? props.engine;
    const engineFamily = getEngineFamily(engine);
    const engineVersion = getEngineVersion(engine);

    const paramGroupName = props.clusterParameters?.name || `${props.clusterName}-cluster-${engineFamily}-${engineVersion}`;

    const description = props.clusterParameters?.description || `Cluster parameter group for ${props.clusterName} (${engineFamily} ${engineVersion})`;

    const id = `${props.clusterName}-ClusterParams-${engineFamily}-${engineVersion}`;

    return new ParameterGroup(scope, id, {
        engine,
        name: paramGroupName.replace(/\./g, '-'),
        parameters: props.clusterParameters?.parameters || {},
        description,
    });
};

/**
 * Creates a parameter group for Aurora instances.
 *
 * @param scope - The construct scope
 * @param props - Cluster configuration properties
 * @returns The created parameter group
 *
 * @example
 * ```typescript
 * const paramGroup = createInstanceParameterGroup(this, props);
 * ```
 *
 * @public
 */
export const createInstanceParameterGroup = (scope: Construct, props: AuroraMySqlClusterProps | AuroraPostgresClusterProps): ParameterGroup => {
    const engine = props.instanceParameters?.engine ?? props.engine;
    const engineFamily = getEngineFamily(engine);
    const engineVersion = getEngineVersion(engine);

    const paramGroupName = props.instanceParameters?.name || `${props.clusterName}-instance-${engineFamily}-${engineVersion}`;

    const description = props.instanceParameters?.description || `Instance parameter group for ${props.clusterName} (${engineFamily} ${engineVersion})`;

    const id = `${props.clusterName}-InstanceParams-${engineFamily}-${engineVersion}`;

    return new ParameterGroup(scope, id, {
        engine,
        name: paramGroupName.replace(/\./g, '-'),
        parameters: props.instanceParameters?.parameters || {},
        description,
    });
};

/**
 * Creates reader instances for the Aurora cluster.
 *
 * @param props - Cluster configuration properties
 * @param instanceParameterGroup - Parameter group for instances
 * @returns Array of cluster reader instances
 *
 * @internal
 */
export const createClusterReaders = (
    props: AuroraMySqlClusterProps | AuroraPostgresClusterProps,
    instanceParameterGroup: ParameterGroup
): IClusterInstance[] => {
    const readers: IClusterInstance[] = [];
    const readerCount = props.readersConfig?.readerInstanceCount || 0;

    if (readerCount > 0 && props.readersConfig?.instanceType) {
        for (let i = 0; i < readerCount; i++) {
            readers.push(
                ClusterInstance.provisioned(`reader${i}`, {
                    instanceType: props.readersConfig.instanceType,
                    instanceIdentifier: `${props.clusterName}-reader-${i}`,
                    publiclyAccessible: false,
                    allowMajorVersionUpgrade: false,
                    caCertificate,
                    parameterGroup: instanceParameterGroup,
                })
            );
        }
    }

    return readers;
};

/**
 * Creates a security group for Aurora cluster.
 *
 * @param scope - The construct scope
 * @param id - Unique identifier for the security group
 * @param vpc - VPC where the security group will be created
 * @param port - Database port number
 * @param props - Cluster configuration properties
 * @returns The created security group
 *
 * @example
 * ```typescript
 * const sg = createAuroraSecurityGroup(this, 'ClusterSG', vpc, 3306, props);
 * ```
 *
 * @public
 */
/**
 * Validates that a CIDR block is not too permissive for RDS security groups.
 *
 * @param cidr - The CIDR block to validate
 * @throws Error if CIDR is 0.0.0.0/0 or prefix is less than /16
 *
 * @internal
 */
const validateCidr = (cidr: string): void => {
    // Check for 0.0.0.0/0
    if (cidr === '0.0.0.0/0') {
        throw new Error('Security violation: CIDR 0.0.0.0/0 (open to the internet) is not allowed for RDS security groups');
    }

    // Extract prefix length (e.g., "24" from "10.0.0.0/24")
    const prefixMatch = cidr.match(/\/(\d+)$/);
    if (prefixMatch) {
        const prefix = parseInt(prefixMatch[1], 10);
        if (prefix < 16) {
            throw new Error(
                `Security violation: CIDR ${cidr} has prefix /${prefix} which is less restrictive than /16. Only /16 or more restrictive (higher number) CIDRs are allowed.`
            );
        }
    }
};

export const createAuroraSecurityGroup = (
    scope: Construct,
    id: string,
    vpc: IVpc,
    port: number,
    props: AuroraMySqlClusterProps | AuroraPostgresClusterProps
): SecurityGroup => {
    const sg = new SecurityGroup(scope, id, {
        vpc,
        allowAllOutbound: true,
        securityGroupName: `${props.clusterName}-rds-sg`,
        description: `Security group for ${props.clusterName} Aurora cluster`,
    });

    // Allow access from VPC CIDR
    sg.addIngressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.tcp(port), `Allow Aurora traffic from VPC ${vpc.vpcCidrBlock}`);

    // Allow access from additional CIDRs if provided
    if (props.allowedInboundCidrs && props.allowedInboundCidrs.length > 0) {
        props.allowedInboundCidrs.forEach(cidr => {
            // Validate CIDR before adding
            validateCidr(cidr);
            sg.addIngressRule(Peer.ipv4(cidr), Port.tcp(port), `Allow Aurora traffic from ${cidr}`);
        });
    }

    sg.applyRemovalPolicy(RemovalPolicy.DESTROY);

    return sg;
};
