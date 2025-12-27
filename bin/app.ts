import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {CodeArtifactStack} from '../lib/stacks/code-artifact-stack';
import {integrationEnvironments} from './environment';

const app = new App();

// Create CodeArtifact stacks for each integration environment
integrationEnvironments.forEach(env => {
    if (env.codeArtifact) {
        new CodeArtifactStack(app, `code-artifact-${env.name}`, {
            account: env.account,
            region: env.region,
            name: env.name,
            owner: env.owner,
            ...env.codeArtifact,
        });
    }
});

app.synth();
