import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {Vpc} from 'aws-cdk-lib/aws-ec2';
import {DatabaseClusterEngine, AuroraMysqlEngineVersion, DatabaseInsightsMode} from 'aws-cdk-lib/aws-rds';
import {InstanceType, InstanceClass, InstanceSize} from 'aws-cdk-lib/aws-ec2';
import {createAuroraMySqlCluster} from '../src/constructs/aurora-mysql-cluster';

describe('Aurora MySQL Cluster', () => {
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

    test('creates Aurora MySQL cluster with basic configuration', () => {
        createAuroraMySqlCluster(stack, {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'test-mysql-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                description: 'Test instance parameters',
            },
        });

        const template = Template.fromStack(stack);

        // Verify cluster is created
        template.resourceCountIs('AWS::RDS::DBCluster', 1);

        // Verify cluster has correct engine
        template.hasResourceProperties('AWS::RDS::DBCluster', {
            Engine: 'aurora-mysql',
            StorageEncrypted: true,
        });

        // Verify security group is created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        // Verify parameter groups are created
        template.resourceCountIs('AWS::RDS::DBClusterParameterGroup', 1);
        template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('creates Aurora MySQL cluster with Database Insights enabled', () => {
        createAuroraMySqlCluster(stack, {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'test-mysql-cluster',
            vpcId: testVpcId,
            subnetIds: ['subnet-1', 'subnet-2'],
            writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
            databaseName: 'testdb',
            databaseInsightsMode: DatabaseInsightsMode.ADVANCED,
            cloudwatchLogsExports: ['error', 'slowquery'],
            clusterParameters: {
                name: 'test-cluster-params',
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                description: 'Test instance parameters',
            },
        });

        const template = Template.fromStack(stack);

        // Verify Database Insights mode is set
        template.hasResourceProperties('AWS::RDS::DBCluster', {
            DatabaseInsightsMode: 'advanced',
            EnableCloudwatchLogsExports: ['error', 'slowquery'],
        });
    });

    test('creates Aurora MySQL cluster with reader instances', () => {
        createAuroraMySqlCluster(stack, {
            engine: DatabaseClusterEngine.auroraMysql({
                version: AuroraMysqlEngineVersion.VER_3_09_0,
            }),
            clusterName: 'test-mysql-cluster',
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
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                description: 'Test cluster parameters',
            },
            instanceParameters: {
                name: 'test-instance-params',
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
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
            createAuroraMySqlCluster(stack, {
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                clusterName: 'test-mysql-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['0.0.0.0/0'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test instance parameters',
                },
            });
        }).toThrow('Security violation: CIDR 0.0.0.0/0 (open to the internet) is not allowed for RDS security groups');
    });

    test('rejects CIDR with prefix less than /16', () => {
        expect(() => {
            createAuroraMySqlCluster(stack, {
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                clusterName: 'test-mysql-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['10.0.0.0/8'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test instance parameters',
                },
            });
        }).toThrow('Security violation: CIDR 10.0.0.0/8 has prefix /8 which is less restrictive than /16');
    });

    test('accepts valid CIDR blocks', () => {
        expect(() => {
            createAuroraMySqlCluster(stack, {
                engine: DatabaseClusterEngine.auroraMysql({
                    version: AuroraMysqlEngineVersion.VER_3_09_0,
                }),
                clusterName: 'test-mysql-cluster',
                vpcId: testVpcId,
                subnetIds: ['subnet-1', 'subnet-2'],
                writerInstanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                databaseName: 'testdb',
                allowedInboundCidrs: ['10.0.0.0/16', '192.168.1.0/24'],
                clusterParameters: {
                    name: 'test-cluster-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test cluster parameters',
                },
                instanceParameters: {
                    name: 'test-instance-params',
                    engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_09_0}),
                    description: 'Test instance parameters',
                },
            });
        }).not.toThrow();
    });
});
