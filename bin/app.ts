import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {CodeArtifactStack} from '../lib/stacks/code-artifact-stack';
import {AuroraMySqlDevStack} from '../examples/aurora/stacks/aurora-mysql-dev-stack';
import {AuroraMySqlProdStack} from '../examples/aurora/stacks/aurora-mysql-prod-stack';
import {AuroraPostgresDevStack} from '../examples/aurora/stacks/aurora-postgres-dev-stack';
import {AuroraPostgresProdStack} from '../examples/aurora/stacks/aurora-postgres-prod-stack';
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

    // Create Aurora MySQL stack if configured
    if (env.auroraMySql) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev') {
            new AuroraMySqlDevStack(app, `aurora-mysql-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new AuroraMySqlProdStack(app, `aurora-mysql-${env.name}`, envProps);
        }
    }

    // Create Aurora PostgreSQL stack if configured
    if (env.auroraPostgres) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new AuroraPostgresDevStack(app, `aurora-postgres-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new AuroraPostgresProdStack(app, `aurora-postgres-${env.name}`, envProps);
        }
    }
});

app.synth();
