/**
 * Comprehensive Usage Examples for Test Data Management System
 * Demonstrates all major features and patterns
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import { TestDataManager } from '../../src/data/test-data-manager.js';
import { FactoryRegistry } from '../../src/data/entity-factory.js';
import { registerExampleFactories } from './example-factories.js';
import { CleanupStrategy } from '../../src/types/test-data-types.js';

/**
 * Example 1: Basic Entity Creation with Factories
 */
export async function example1_basicFactoryUsage() {
  console.log('=== Example 1: Basic Factory Usage ===\n');

  const manager = new TestDataManager();
  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  // Build a user (no persistence)
  const user = await registry.get('user').build();
  console.log('Built user:', user);

  // Build user with overrides
  const adminUser = await registry.get('user').build({
    email: 'custom@example.com',
    role: 'admin',
  });
  console.log('\nBuilt admin user:', adminUser);

  // Build multiple users
  const users = await registry.get('user').buildMany(3);
  console.log(`\nBuilt ${users.length} users`);
}

/**
 * Example 2: Using Traits for Entity Variations
 */
export async function example2_traitsUsage() {
  console.log('\n=== Example 2: Using Traits ===\n');

  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  // Create admin user using trait
  const admin = await registry.get('user').trait('admin').build();
  console.log('Admin user:', { role: admin.role });

  // Create moderator with profile
  const moderator = await registry
    .get('user')
    .trait('moderator')
    .trait('withProfile')
    .build();
  console.log('Moderator with profile:', {
    role: moderator.role,
    hasProfile: !!moderator.profile,
  });

  // Create inactive user
  const inactive = await registry.get('user').trait('inactive').build();
  console.log('Inactive user:', { isActive: inactive.isActive });

  // Create published post
  const post = await registry.get('post').trait('published').build();
  console.log('Published post:', {
    status: post.status,
    publishedAt: post.publishedAt,
  });
}

/**
 * Example 3: Building Entities with Relationships
 */
export async function example3_relationships() {
  console.log('\n=== Example 3: Entity Relationships ===\n');

  const registry = new FactoryRegistry({
    autoCreateRelationships: true,
  });
  registerExampleFactories(registry);

  // Create user with auto-generated profile and settings
  const userWithRelations = await registry.get('user').build();
  console.log('User with relations:', {
    hasProfile: !!userWithRelations.profile,
    hasSettings: !!userWithRelations.settings,
  });

  // Create user with specific relationship data
  const userWithCustomProfile = await registry
    .get('user')
    .with('profile', {
      bio: 'Custom bio for this user',
      location: 'Custom Location',
    })
    .build();
  console.log('User with custom profile:', userWithCustomProfile.profile);
}

/**
 * Example 4: Loading Fixtures from Files
 */
export async function example4_fixtureLoading() {
  console.log('\n=== Example 4: Loading Fixtures ===\n');

  const manager = new TestDataManager({
    fixtures: {
      baseDir: './examples/test-data/fixtures',
    },
  });

  // Load users from JSON file
  const users = await manager.loadFixtures('users.json');
  console.log(`Loaded ${users.length} users from JSON`);
  console.log('First user:', users[0].data);

  // Load posts from YAML file
  const posts = await manager.loadFixtures('posts.yaml');
  console.log(`\nLoaded ${posts.length} posts from YAML`);
  console.log('First post:', posts[0].data);

  // Load all fixtures from directory
  const allFixtures = await manager.loadFixturesDirectory('.');
  console.log(`\nLoaded ${allFixtures.length} total fixtures`);
  console.log('Fixture types:', [...new Set(allFixtures.map(f => f.type))]);
}

/**
 * Example 5: Fixture Composition and Inheritance
 */
export async function example5_fixtureComposition() {
  console.log('\n=== Example 5: Fixture Composition ===\n');

  const manager = new TestDataManager({
    fixtures: {
      baseDir: './examples/test-data/fixtures',
      compositionStrategy: 'merge',
    },
  });

  const users = await manager.loadFixtures('users.json');

  // Find user that extends another
  const extendedUser = users.find(u => u.id === 'user-2');
  console.log('Extended user inherits from user-1:', extendedUser?.data);

  // User with relationships
  const userWithRels = users.find(u => u.id === 'user-3');
  console.log('\nUser with relationships:', {
    id: userWithRels?.id,
    relationships: userWithRels?.relationships,
  });
}

/**
 * Example 6: Database Seeding
 */
export async function example6_databaseSeeding() {
  console.log('\n=== Example 6: Database Seeding ===\n');

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
  console.log('Database seeded successfully');

  // Seed specific files
  await manager.seed(['./seeds/test-data.json']);
  console.log('Specific seed executed');
}

/**
 * Example 7: Snapshots and Restore
 */
export async function example7_snapshots() {
  console.log('\n=== Example 7: Snapshots ===\n');

  const manager = new TestDataManager({
    snapshots: {
      enabled: true,
      autoCreate: false,
    },
  });

  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  // Create some test data
  const user1 = await manager.create('user', {
    email: 'user1@example.com',
  });
  const user2 = await manager.create('user', {
    email: 'user2@example.com',
  });

  console.log('Created users:', { user1: user1.email, user2: user2.email });

  // Create snapshot
  const snapshot = await manager.createSnapshot('test-snapshot', {
    description: 'State with 2 users',
    tags: ['test', 'users'],
  });
  console.log('\nSnapshot created:', snapshot.id);

  // Make changes
  await manager.create('user', { email: 'user3@example.com' });
  console.log('Created user3');
  console.log('Stats:', manager.getStats());

  // Restore snapshot
  await manager.restoreSnapshot('test-snapshot');
  console.log('\nRestored snapshot');
  console.log('Stats after restore:', manager.getStats());
}

/**
 * Example 8: Transaction Management
 */
export async function example8_transactions() {
  console.log('\n=== Example 8: Transactions ===\n');

  const manager = new TestDataManager({
    useTransactions: true,
    snapshots: {
      enabled: true,
      autoCreate: true,
    },
  });

  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  // Begin transaction
  const txId = await manager.beginTransaction();
  console.log('Transaction started:', txId);

  // Create data within transaction
  await manager.create('user', { email: 'tx-user@example.com' });
  console.log('Created user in transaction');
  console.log('Stats:', manager.getStats());

  // Rollback transaction
  await manager.rollbackTransaction();
  console.log('\nTransaction rolled back');
  console.log('Stats after rollback:', manager.getStats());
}

/**
 * Example 9: Complex Test Scenarios
 */
export async function example9_complexScenarios() {
  console.log('\n=== Example 9: Complex Test Scenarios ===\n');

  const manager = new TestDataManager();
  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  // Scenario: Blog with users, posts, and comments
  console.log('Creating blog scenario...');

  // Create 3 users (1 admin, 2 regular)
  const admin = await manager.create('user', {
    role: 'admin',
    email: 'admin@blog.com',
  });

  const authors = await manager.createMany('user', 2);

  // Create 10 posts by different authors
  const posts = [];
  for (let i = 0; i < 10; i++) {
    const author = i < 5 ? authors[0] : authors[1];
    const post = await registry
      .get('post')
      .trait(i % 3 === 0 ? 'published' : 'draft')
      .build({
        userId: author.id,
      });
    posts.push(post);
  }

  console.log(`Created blog with:`);
  console.log(`  - 1 admin`);
  console.log(`  - 2 authors`);
  console.log(`  - 10 posts`);
  console.log(`  - Published: ${posts.filter(p => p.status === 'published').length}`);
  console.log(`  - Drafts: ${posts.filter(p => p.status === 'draft').length}`);
}

/**
 * Example 10: Integration with Vitest Tests
 */
describe('Test Data Manager Integration', () => {
  let manager: TestDataManager;
  let registry: FactoryRegistry;

  beforeEach(async () => {
    // Setup test data manager
    manager = new TestDataManager({
      cleanupAfterTests: CleanupStrategy.DELETE,
      useTransactions: true,
      snapshots: {
        enabled: true,
        autoCreate: true,
      },
    });

    registry = new FactoryRegistry();
    registerExampleFactories(registry);

    // Create initial snapshot
    await manager.createSnapshot('initial');
  });

  afterEach(async () => {
    // Cleanup after each test
    await manager.cleanup();
  });

  it('should create user with factory', async () => {
    const user = await registry.get('user').build();

    console.log('Created user:', user.email);
    // Add assertions here
  });

  it('should create admin user with trait', async () => {
    const admin = await registry.get('user').trait('admin').build();

    console.log('Created admin:', admin);
    // Add assertions here
  });

  it('should load fixtures', async () => {
    const users = await manager.loadFixtures(
      './examples/test-data/fixtures/users.json'
    );

    console.log(`Loaded ${users.length} users from fixtures`);
    // Add assertions here
  });

  it('should handle transactions', async () => {
    const txId = await manager.beginTransaction();

    try {
      await manager.create('user', { email: 'test@example.com' });
      await manager.commitTransaction();
    } catch (error) {
      await manager.rollbackTransaction();
      throw error;
    }
  });

  it('should restore from snapshot', async () => {
    // Create some data
    await manager.create('user', { email: 'user1@example.com' });

    // Restore to initial state
    await manager.restoreSnapshot('initial');

    const stats = manager.getStats();
    console.log('Stats after restore:', stats);
  });
});

/**
 * Example 11: Sequences Usage
 */
export async function example11_sequences() {
  console.log('\n=== Example 11: Using Sequences ===\n');

  const registry = new FactoryRegistry();
  registerExampleFactories(registry);

  const factory = registry.get('user');

  // Generate users with sequential emails
  const users = [];
  for (let i = 0; i < 5; i++) {
    const email = factory.sequence('email');
    const user = await factory.build({ email });
    users.push(user);
  }

  console.log('Users with sequential emails:');
  users.forEach(u => console.log(`  - ${u.email}`));

  // Reset sequence
  factory.resetSequence('email');
  console.log('\nSequence reset');
}

/**
 * Example 12: Custom Cleanup Strategies
 */
export async function example12_cleanupStrategies() {
  console.log('\n=== Example 12: Cleanup Strategies ===\n');

  // Strategy 1: Delete all data
  const manager1 = new TestDataManager({
    cleanupAfterTests: CleanupStrategy.DELETE,
  });

  await manager1.create('user', { email: 'test@example.com' });
  console.log('Before cleanup:', manager1.getStats());

  await manager1.cleanup(CleanupStrategy.DELETE);
  console.log('After DELETE cleanup:', manager1.getStats());

  // Strategy 2: Snapshot restore
  const manager2 = new TestDataManager({
    cleanupAfterTests: CleanupStrategy.SNAPSHOT,
    snapshots: { enabled: true },
  });

  await manager2.createSnapshot('initial');
  await manager2.create('user', { email: 'test2@example.com' });
  console.log('\nBefore snapshot restore:', manager2.getStats());

  await manager2.cleanup(CleanupStrategy.SNAPSHOT);
  console.log('After SNAPSHOT cleanup:', manager2.getStats());
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  const examples = [
    { name: 'Basic Factory Usage', fn: example1_basicFactoryUsage },
    { name: 'Traits Usage', fn: example2_traitsUsage },
    { name: 'Relationships', fn: example3_relationships },
    { name: 'Fixture Loading', fn: example4_fixtureLoading },
    { name: 'Fixture Composition', fn: example5_fixtureComposition },
    { name: 'Database Seeding', fn: example6_databaseSeeding },
    { name: 'Snapshots', fn: example7_snapshots },
    { name: 'Transactions', fn: example8_transactions },
    { name: 'Complex Scenarios', fn: example9_complexScenarios },
    { name: 'Sequences', fn: example11_sequences },
    { name: 'Cleanup Strategies', fn: example12_cleanupStrategies },
  ];

  console.log('='.repeat(60));
  console.log('Running All Test Data Management Examples');
  console.log('='.repeat(60));

  for (const example of examples) {
    try {
      console.log(`\n\nRunning: ${example.name}`);
      console.log('-'.repeat(60));
      await example.fn();
    } catch (error) {
      console.error(`Error in ${example.name}:`, error);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('All examples completed!');
  console.log('='.repeat(60));
}

// Uncomment to run all examples
// runAllExamples().catch(console.error);
