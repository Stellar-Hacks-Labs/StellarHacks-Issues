import { describe, it, expect } from 'vitest';
import {
  heroImageConfig,
  avatarImageConfig,
  thumbnailImageConfig,
  artworkImageConfig,
} from './image-policy';

describe('image policy helpers', () => {
  it('hero images use priority loading', () => {
    const config = heroImageConfig('/hero.jpg', 'Hero image', 1200, 600);
    
    expect(config.priority).toBe(true);
    expect(config.sizes).toContain('100vw');
  });

  it('avatars are fixed size and lazy loaded', () => {
    const config = avatarImageConfig('/avatar.jpg', 'User avatar', 48);
    
    expect(config.width).toBe(48);
    expect(config.height).toBe(48);
    expect(config.priority).toBe(false);
    expect(config.sizes).toBe('48px');
  });

  it('thumbnails are responsive and lazy loaded', () => {
    const config = thumbnailImageConfig('/thumb.jpg', 'Thumbnail', 400, 300);
    
    expect(config.priority).toBe(false);
    expect(config.sizes).toContain('50vw');
  });

  it('artwork can be above fold or lazy', () => {
    const aboveFold = artworkImageConfig('/art.png', 'Artwork', 500, 500, true);
    const lazy = artworkImageConfig('/art.png', 'Artwork', 500, 500, false);
    
    expect(aboveFold.priority).toBe(true);
    expect(lazy.priority).toBe(false);
  });

  it('all configs include required attributes', () => {
    const configs = [
      heroImageConfig('/test.jpg', 'Test', 100, 100),
      avatarImageConfig('/test.jpg', 'Test', 48),
      thumbnailImageConfig('/test.jpg', 'Test', 100, 100),
      artworkImageConfig('/test.jpg', 'Test', 100, 100),
    ];
    
    for (const config of configs) {
      expect(config.src).toBeTruthy();
      expect(config.alt).toBeTruthy();
      expect(config.width).toBeGreaterThan(0);
      expect(config.height).toBeGreaterThan(0);
      expect(typeof config.priority).toBe('boolean');
    }
  });
});
