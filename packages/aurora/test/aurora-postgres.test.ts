import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {Vpc} from 'aws-cdk-lib/aws-ec2';
import {DatabaseClusterEngine, AuroraPostgresEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {createAuroraPostgresCluster} from '../src/constructs/aurora-postgres-cluster';

describe('Aurora PostgreSQL Cluster', () => {
    let app: App;
    let stack: Stack;
    const testVpcId = 'vpc-12345';

    beforeEach(() => {
        app = new App({
            context: {
                'availability-zones:account=123456789012:region=us-east-1': ['us-east-1a', 'us-east-1b'],
                'vpc-provider:account=123456789012:filter.vpc-id=vpc-12345:region=us-east-1:returnAsymmetricSubnets=true': {
                    vpcId: 'vpc-12345',
                    vpcCidrBlock: '10.0.0.0/16',
                    subnetGroups: [
                        {
                            name: 'Private',
                            type: 'Private',
                            subnets: [
                                {subnetId: 'subnet-1', availabilityZone: 'us-east-1a', routeTableId: 'rtb-1'},
                                {subnetId: 'subnet-2', availabilityZone: 'us-east-1b', routeTableId: 'rtb-2'},
                            ],
                        },
                    ],
                },
            },
        });
        stack = new Stack(app, 'TestStack', {
            env: {account: '123456789012', region: 'us-east-1'},
        });
    });

    test('creates Aurora PostgreSQL cluster with basic configuration', () => {
        createAuroraPostgresCluster(stack, {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_16_4,
            }),
            clusterName: 'test-postgres-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test instance parameters',
            },
        });

        const template = Template.fromStack(stack);

        // Verify cluster is created
        template.resourceCountIs('AWS::RDS::DBCluster', 1);

        // Verify cluster has correct engine
        template.hasResourceProperties('AWS::RDS::DBCluster', {
            Engine: 'aurora-postgresql',
            StorageEncrypted: true,
        });

        // Verify security group is created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        // Verify parameter groups are created
        template.resourceCountIs('AWS::RDS::DBClusterParameterGroup', 1);
        template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('creates Aurora PostgreSQL cluster with Database Insights enabled', () => {
        createAuroraPostgresCluster(stack, {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_16_4,
            }),
            clusterName: 'test-postgres-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
            cloudwatchLogsExports: ['postgresql'],
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test instance parameters',
            },
        });

        const template = Template.fromStack(stack);

        // Verify Database Insights mode is set
        template.hasResourceProperties('AWS::RDS::DBCluster', {
            DatabaseInsightsMode: 'advanced',
            EnableCloudwatchLogsExports: ['postgresql'],
        });
    });

    test('creates Aurora PostgreSQL cluster with reader instances', () => {
        createAuroraPostgresCluster(stack, {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_16_4,
            }),
            clusterName: 'test-postgres-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            readersConfig: {
                readerInstanceCount: 2,
                instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            },
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test instance parameters',
            },
        });

        const template = Template.fromStack(stack);

        // Verify cluster is created
        template.resourceCountIs('AWS::RDS::DBCluster', 1);

        // Verify writer and reader instances are created (1 writer + 2 readers = 3)
        template.resourceCountIs('AWS::RDS::DBInstance', 3);
    });

    test('rejects CIDR 0.0.0.0/0', () => {
        expect(() => {
            createAuroraPostgresCluster(stack, {
                engine: DatabaseClusterEngine.auroraPostgres({
                    version: AuroraPostgresEngineVersion.VER_16_4,
                }),
                clusterName: 'test-postgres-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['0.0.0.0/0'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test instance parameters',
                },
            });
        }).toThrow('Security violation: CIDR 0.0.0.0/0 (open to the internet) is not allowed for RDS security groups');
    });

    test('rejects CIDR with prefix less than /16', () => {
        expect(() => {
            createAuroraPostgresCluster(stack, {
                engine: DatabaseClusterEngine.auroraPostgres({
                    version: AuroraPostgresEngineVersion.VER_16_4,
                }),
                clusterName: 'test-postgres-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['10.0.0.0/8'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test instance parameters',
                },
            });
        }).toThrow('Security violation: CIDR 10.0.0.0/8 has prefix /8 which is less restrictive than /16');
    });

    test('accepts valid CIDR blocks', () => {
        expect(() => {
            createAuroraPostgresCluster(stack, {
                engine: DatabaseClusterEngine.auroraPostgres({
                    version: AuroraPostgresEngineVersion.VER_16_4,
                }),
                clusterName: 'test-postgres-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['10.0.0.0/16', '192.168.1.0/24'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                    description: 'Test instance parameters',
                },
            });
        }).not.toThrow();
    });

    test('accepts subnetIds for subnet selection', () => {
        const {cluster} = createAuroraPostgresCluster(stack, {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_16_4,
            }),
            clusterName: 'test-postgres-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_4}),
                description: 'Test instance parameters',
            },
        });

        expect(cluster).toBeDefined();
    });
});
