import {Construct} from 'constructs';
import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import {createCodeArtifact, CodeArtifactStackProps} from '@cdk-constructs/codeartifact';
import {EnvironmentConfig} from '@cdk-constructs/aws';

/**
 * CodeArtifact stack properties.
 */
export type CodeArtifactStackPropsWithEnv = StackProps & CodeArtifactStackProps & EnvironmentConfig;

/**
 * CodeArtifact stack for integration testing.
 *
 * @remarks
 * This stack creates a CodeArtifact domain and repository with proper
 * environment configuration and tagging.
 */
export class CodeArtifactStack extends Stack {
    constructor(scope: Construct, id: string, props: CodeArtifactStackPropsWithEnv) {
        super(scope, id, {
            ...props,
            env: {
                account: props.account,
                region: props.region,
            },
        });

        // Add environment tags
        Tags.of(this).add('Environment', props.name);
        Tags.of(this).add('Owner', props.owner);

        createCodeArtifact(this, 'cdk-constructs-codeartifact', {
            codeArtifactDomainName: props.codeArtifactDomainName,
            codeArtifactRepositoryName: props.codeArtifactRepositoryName,
            codeArtifactRepositoryDescription: props.codeArtifactRepositoryDescription,
            codeArtifactTags: props.codeArtifactTags,
            allowedAccounts: props.allowedAccounts,
        });
    }
}
