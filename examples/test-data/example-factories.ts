/**
 * Example Entity Factory Definitions
 * Demonstrates how to define entities with relationships, traits, and sequences
 */

import { faker } from '@faker-js/faker';
import {
  EntityDefinition,
  RelationType,
  sequence,
  sequences,
} from '../../src/types/test-data-types.js';
import { FactoryRegistry } from '../../src/data/entity-factory.js';

/**
 * User entity interface
 */
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  createdAt: Date;
  profile?: UserProfile;
  posts?: Post[];
  settings?: UserSettings;
}

/**
 * User profile entity
 */
interface UserProfile {
  id: string;
  userId: string;
  bio: string;
  avatar: string;
  website?: string;
  location?: string;
}

/**
 * Post entity
 */
interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  tags: string[];
  comments?: Comment[];
}

/**
 * Comment entity
 */
interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

/**
 * User settings entity
 */
interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
}

/**
 * User Factory Definition
 */
const userFactory: EntityDefinition<User> = {
  type: 'user',

  factory: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  defaults: {
    role: 'user',
    isActive: true,
  },

  sequences: {
    id: sequences.uuid(),
    email: sequences.email('example.com', 'user'),
    username: sequences.username('user'),
  },

  traits: {
    admin: {
      name: 'admin',
      attributes: { role: 'admin' },
    },
    moderator: {
      name: 'moderator',
      attributes: { role: 'moderator' },
    },
    inactive: {
      name: 'inactive',
      attributes: { isActive: false },
    },
    withProfile: {
      name: 'withProfile',
      attributes: (user) => ({
        profile: {
          id: faker.string.uuid(),
          userId: user.id,
          bio: faker.lorem.paragraph(),
          avatar: faker.image.avatar(),
          website: faker.internet.url(),
          location: faker.location.city(),
        },
      }),
    },
    withPosts: {
      name: 'withPosts',
      attributes: {},
      requires: [],
    },
  },

  relationships: [
    {
      name: 'profile',
      type: RelationType.HAS_ONE,
      target: 'userProfile',
      foreignKey: 'userId',
      autoCreate: true,
      factory: 'userProfile',
      cascade: { create: true, delete: true },
    },
    {
      name: 'posts',
      type: RelationType.HAS_MANY,
      target: 'post',
      foreignKey: 'userId',
      autoCreate: false,
      factory: 'post',
      count: 3,
    },
    {
      name: 'settings',
      type: RelationType.HAS_ONE,
      target: 'userSettings',
      foreignKey: 'userId',
      autoCreate: true,
      factory: 'userSettings',
    },
  ],

  afterBuild: (user) => {
    // Ensure email matches username
    if (user.username && !user.email.includes(user.username)) {
      user.email = `${user.username}@example.com`;
    }
    return user;
  },
};

/**
 * User Profile Factory Definition
 */
const userProfileFactory: EntityDefinition<UserProfile> = {
  type: 'userProfile',

  factory: (overrides = {}, context) => ({
    id: faker.string.uuid(),
    userId: context?.parent?.id || faker.string.uuid(),
    bio: faker.lorem.paragraph(),
    avatar: faker.image.avatar(),
    website: faker.internet.url(),
    location: faker.location.city(),
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
  },
};

/**
 * Post Factory Definition
 */
const postFactory: EntityDefinition<Post> = {
  type: 'post',

  factory: (overrides = {}, context) => ({
    id: faker.string.uuid(),
    userId: context?.parent?.id || faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    status: 'draft',
    tags: faker.helpers.arrayElements(
      ['javascript', 'typescript', 'testing', 'api', 'tutorial'],
      3
    ),
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
    title: sequence(n => `Post ${n}: ${faker.lorem.words(3)}`),
  },

  traits: {
    published: {
      name: 'published',
      attributes: {
        status: 'published',
        publishedAt: new Date(),
      },
    },
    draft: {
      name: 'draft',
      attributes: {
        status: 'draft',
        publishedAt: undefined,
      },
    },
    archived: {
      name: 'archived',
      attributes: {
        status: 'archived',
      },
    },
    withComments: {
      name: 'withComments',
      attributes: {},
    },
  },

  relationships: [
    {
      name: 'comments',
      type: RelationType.HAS_MANY,
      target: 'comment',
      foreignKey: 'postId',
      autoCreate: false,
      factory: 'comment',
      count: (post) => Math.floor(Math.random() * 10) + 1,
    },
  ],
};

/**
 * Comment Factory Definition
 */
const commentFactory: EntityDefinition<Comment> = {
  type: 'comment',

  factory: (overrides = {}, context) => ({
    id: faker.string.uuid(),
    postId: context?.parent?.id || faker.string.uuid(),
    userId: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    createdAt: new Date(),
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
  },
};

/**
 * User Settings Factory Definition
 */
const userSettingsFactory: EntityDefinition<UserSettings> = {
  type: 'userSettings',

  factory: (overrides = {}, context) => ({
    id: faker.string.uuid(),
    userId: context?.parent?.id || faker.string.uuid(),
    theme: 'light',
    notifications: true,
    emailDigest: 'daily',
    ...overrides,
  }),

  traits: {
    darkMode: {
      name: 'darkMode',
      attributes: { theme: 'dark' },
    },
    minimal: {
      name: 'minimal',
      attributes: {
        notifications: false,
        emailDigest: 'never',
      },
    },
  },
};

/**
 * Register all factories
 */
export function registerExampleFactories(registry: FactoryRegistry): void {
  registry.register(userFactory);
  registry.register(userProfileFactory);
  registry.register(postFactory);
  registry.register(commentFactory);
  registry.register(userSettingsFactory);
}

/**
 * Export factory definitions
 */
export const factories = {
  user: userFactory,
  userProfile: userProfileFactory,
  post: postFactory,
  comment: commentFactory,
  userSettings: userSettingsFactory,
};
