import * as migration_20261117_041344_add_friends_and_affiliate_links from './20261117_041344_add_friends_and_affiliate_links';

export const migrations = [
  {
    up: migration_20261117_041344_add_friends_and_affiliate_links.up,
    down: migration_20261117_041344_add_friends_and_affiliate_links.down,
    name: '20261117_041344_add_friends_and_affiliate_links'
  },
];
