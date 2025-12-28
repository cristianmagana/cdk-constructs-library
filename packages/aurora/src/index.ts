/**
 * @cdk-constructs/aurora
 *
 * Aurora PostgreSQL and MySQL constructs for CDK Constructs Library.
 *
 * @remarks
 * This package provides production-ready Aurora database cluster constructs with:
 * - CloudWatch Database Insights (replaces deprecated Performance Insights)
 * - Flexible engine version support (no forced upgrades)
 * - Custom parameter groups
 * - Optional read replicas
 * - Encryption and security best practices
 *
 * Starting June 30, 2026, Performance Insights will be deprecated.
 * This package uses CloudWatch Database Insights for enhanced monitoring.
 *
 * @packageDocumentation
 */

export * from './constructs/aurora-mysql-cluster';
export * from './constructs/aurora-postgres-cluster';
export * from './types/aurora-cluster-base';
export * from './types/aurora-mysql-cluster';
export * from './types/aurora-postgres-cluster';
export * from './util/aurora-helpers';
export * from './util/kms-helpers';
export * from './util/vpc-helpers';
