# Test Data Management System - Examples

This directory contains comprehensive examples demonstrating the sophisticated test data management system for AgentBank.

## Overview

The test data management system provides:

- **Entity Factories**: Build complex objects with relationships, traits, and sequences
- **Fixture Loading**: Load test data from JSON, YAML files with composition support
- **Database Seeding**: Seed databases with idempotent scripts
- **Snapshots**: Create and restore data snapshots for testing
- **Transactions**: Manage test data with transaction support
- **Cleanup Strategies**: Various strategies for cleaning up test data

## Files

### Core Implementation Files

- `/src/types/test-data-types.ts` - TypeScript type definitions
- `/src/data/entity-factory.ts` - Entity factory pattern implementation
- `/src/data/fixture-loader.ts` - Fixture loading from files
- `/src/data/data-seeder.ts` - Database seeding system
- `/src/data/test-data-manager.ts` - Main test data manager

### Example Files

- `example-factories.ts` - Example entity factory definitions (User, Post, Comment, etc.)
- `usage-examples.ts` - Comprehensive usage examples and patterns
- `fixtures/users.json` - Example user fixtures in JSON format
- `fixtures/posts.yaml` - Example post fixtures in YAML format
- `fixtures/profiles.json` - Example profile fixtures with relationships

## Quick Start

### 1. Basic Factory Usage

```typescript
import { TestDataManager } from '../../src/data/test-data-manager.js';
import { FactoryRegistry } from '../../src/data/entity-factory.js';
import { registerExampleFactories } from './example-factories.js';

// Setup
const manager = new TestDataManager();
const registry = new FactoryRegistry();
registerExampleFactories(registry);

// Build a user (no persistence)
const user = await registry.get('user').build();

// Build with overrides
const admin = await registry.get('user').build({
  email: 'admin@example.com',
  role: 'admin',
});

// Build multiple entities
const users = await registry.get('user').buildMany(5);
```

### 2. Using Traits

```typescript
// Create admin user with trait
const admin = await registry.get('user').trait('admin').build();

// Apply multiple traits
const moderatorWithProfile = await registry
  .get('user')
  .trait('moderator')
  .trait('withProfile')
  .build();

// Create published post
const post = await registry.get('post').trait('published').build();
```

### 3. Building with Relationships

```typescript
const registry = new FactoryRegistry({
  autoCreateRelationships: true,
});

// User with auto-created profile and settings
const user = await registry.get('user').build();
// user.profile and user.settings are automatically created

// Custom relationship data
const userWithCustomProfile = await registry
  .get('user')
  .with('profile', {
    bio: 'Custom bio',
    location: 'New York',
  })
  .build();
```

### 4. Loading Fixtures

```typescript
const manager = new TestDataManager({
  fixtures: {
    baseDir: './examples/test-data/fixtures',
  },
});

// Load from JSON
const users = await manager.loadFixtures('users.json');

// Load from YAML
const posts = await manager.loadFixtures('posts.yaml');

// Load entire directory
const allFixtures = await manager.loadFixturesDirectory('.');
```

### 5. Database Seeding

```typescript
const manager = new TestDataManager({
  seed: {
    sources: ['./seeds/users.json', './seeds/posts.json'],
    cleanupStrategy: CleanupStrategy.TRUNCATE,
    transaction: true,
    idempotent: true,
  },
});

// Seed database
await manager.seed();

// Seed specific files
await manager.seed(['./seeds/test-data.json']);

// Seed data directly
await manager.seedData('users', [
  { email: 'user1@example.com', username: 'user1' },
  { email: 'user2@example.com', username: 'user2' },
]);
```

### 6. Snapshots and Restore

```typescript
const manager = new TestDataManager({
  snapshots: {
    enabled: true,
    autoCreate: false,
  },
});

// Create snapshot
const snapshot = await manager.createSnapshot('test-state', {
  description: 'Initial test state',
  tags: ['test', 'baseline'],
});

// Make changes...
await manager.create('user', { email: 'test@example.com' });

// Restore snapshot
await manager.restoreSnapshot('test-state');
```

### 7. Transaction Management

```typescript
const manager = new TestDataManager({
  useTransactions: true,
  snapshots: {
    enabled: true,
    autoCreate: true, // Auto-snapshot on transaction start
  },
});

// Begin transaction
const txId = await manager.beginTransaction();

try {
  await manager.create('user', { email: 'tx-user@example.com' });
  await manager.create('post', { title: 'Test Post' });

  // Commit if successful
  await manager.commitTransaction();
} catch (error) {
  // Rollback on error
  await manager.rollbackTransaction();
}
```

### 8. Integration with Tests

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';

describe('My API Tests', () => {
  let manager: TestDataManager;
  let registry: FactoryRegistry;

  beforeEach(async () => {
    manager = new TestDataManager({
      cleanupAfterTests: CleanupStrategy.DELETE,
    });

    registry = new FactoryRegistry();
    registerExampleFactories(registry);

    // Create initial snapshot
    await manager.createSnapshot('initial');
  });

  afterEach(async () => {
    // Auto cleanup after each test
    await manager.cleanup();
  });

  it('should test with user data', async () => {
    const user = await manager.create('user', {
      email: 'test@example.com',
    });

    // Run your test...
  });
});
```

## Advanced Features

### Fixture Composition

Fixtures can extend other fixtures:

```json
{
  "id": "base-user",
  "type": "user",
  "data": {
    "role": "user",
    "isActive": true
  }
}

{
  "id": "admin-user",
  "type": "user",
  "extends": "base-user",
  "data": {
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

### Template Variables

Use template variables in fixtures:

```yaml
- id: user-{{ index }}
  type: user
  data:
    email: user{{ index }}@{{ domain }}
    username: user{{ index }}
  vars:
    index: 1
    domain: example.com
```

### Sequences for Unique Values

```typescript
import { sequences, sequence } from '../../src/data/entity-factory.js';

const userFactory = {
  sequences: {
    id: sequences.uuid(),
    email: sequences.email('example.com', 'user'),
    username: sequences.username('user'),
    customCounter: sequence(n => `custom-${n}`, { start: 100, step: 10 }),
  },
};
```

### Cascading Relationships

```typescript
const userFactory = {
  relationships: [
    {
      name: 'profile',
      type: RelationType.HAS_ONE,
      target: 'userProfile',
      autoCreate: true,
      cascade: {
        create: true,  // Auto-create profile when user is created
        delete: true,  // Delete profile when user is deleted
      },
    },
  ],
};
```

### Cleanup Strategies

```typescript
// Delete all records
await manager.cleanup(CleanupStrategy.DELETE);

// Truncate tables (faster)
await manager.cleanup(CleanupStrategy.TRUNCATE);

// Drop and recreate tables
await manager.cleanup(CleanupStrategy.DROP);

// Restore from snapshot
await manager.cleanup(CleanupStrategy.SNAPSHOT);

// No cleanup
await manager.cleanup(CleanupStrategy.NONE);
```

## Running Examples

```bash
# Run all examples
npm run examples:test-data

# Run specific example
ts-node examples/test-data/usage-examples.ts
```

## Common Patterns

### E-commerce Test Data

```typescript
// Create complete e-commerce scenario
const customer = await manager.create('user', { role: 'customer' });
const products = await manager.createMany('product', 10);
const cart = await manager.create('cart', { userId: customer.id });
const order = await manager.create('order', {
  userId: customer.id,
  items: products.slice(0, 3),
});
```

### SaaS Application Test Data

```typescript
// Create organization with users and resources
const org = await manager.create('organization');
const admin = await manager.create('user', {
  organizationId: org.id,
  role: 'admin',
});
const members = await manager.createMany('user', 5, {
  organizationId: org.id,
  role: 'member',
});
const projects = await manager.createMany('project', 3, {
  organizationId: org.id,
});
```

### Blog Platform Test Data

```typescript
// Create blog with authors, posts, and comments
const authors = await manager.createMany('user', 3);
const posts = [];

for (const author of authors) {
  const authorPosts = await manager.createMany('post', 5, {
    userId: author.id,
  });
  posts.push(...authorPosts);
}

for (const post of posts) {
  await manager.createMany('comment', Math.floor(Math.random() * 10), {
    postId: post.id,
  });
}
```

## Best Practices

1. **Use Factories for Reusable Patterns**: Define factories for all your entities
2. **Leverage Traits for Variations**: Create traits for common entity states
3. **Fixtures for Known Data**: Use fixtures for specific test scenarios
4. **Snapshots for Complex States**: Create snapshots of complex data states
5. **Transactions for Isolation**: Use transactions to isolate test data
6. **Always Cleanup**: Use cleanup strategies to maintain test isolation
7. **Sequence for Uniqueness**: Use sequences for unique values like emails
8. **Relationships for Realism**: Define relationships for realistic test data

## API Reference

See the comprehensive type definitions in `/src/types/test-data-types.ts` for the complete API.

## Contributing

When adding new examples:

1. Add factory definitions to `example-factories.ts`
2. Add fixture files to `fixtures/` directory
3. Add usage examples to `usage-examples.ts`
4. Update this README with new patterns

## License

MIT
