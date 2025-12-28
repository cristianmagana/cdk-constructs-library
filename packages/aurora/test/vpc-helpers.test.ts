import {App, Stack} from 'aws-cdk-lib';
import {Vpc, SubnetType} from 'aws-cdk-lib/aws-ec2';
import {selectSubnetsByIds} from '../src/util/vpc-helpers';

describe('VPC Helpers', () => {
    let app: App;
    let stack: Stack;
    let vpc: Vpc;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {account: '123456789012', region: 'us-east-1'},
        });
        vpc = new Vpc(stack, 'TestVpc', {
            maxAzs: 3,
            natGateways: 1,
        });
    });

    test('selects subnets by IDs', () => {
        // Get subnet IDs from the VPC
        const privateSubnets = vpc.privateSubnets;
        expect(privateSubnets.length).toBeGreaterThan(0);

        // Select first two subnet IDs
        const subnetIds = [privateSubnets[0].subnetId, privateSubnets[1].subnetId];

        const selection = selectSubnetsByIds(vpc, subnetIds);

        // Verify the selection returns the correct subnets
        expect(selection.subnets).toBeDefined();
        expect(selection.subnets?.length).toBe(2);
    });

    test('returns empty array when no subnet IDs match', () => {
        const selection = selectSubnetsByIds(vpc, ['subnet-nonexistent']);

        // Verify empty result
        expect(selection.subnets).toBeDefined();
        expect(selection.subnets?.length).toBe(0);
    });

    test('filters correctly from private subnets only', () => {
        const privateSubnets = vpc.privateSubnets;
        const publicSubnets = vpc.publicSubnets;

        // Try to select a public subnet ID using the helper (should not find it)
        const selection = selectSubnetsByIds(vpc, [publicSubnets[0].subnetId]);

        // Should return empty because selectSubnetsByIds only filters privateSubnets
        expect(selection.subnets?.length).toBe(0);
    });
});
