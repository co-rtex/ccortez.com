import { describe, expect, it } from 'vitest';

import { parseAvatarInspect } from './avatarInspect';

describe('avatar inspection fixture', () => {
  it('is off without the parameter', () => {
    expect(parseAvatarInspect('?shot=1,2,3,4,5,6')).toBeNull();
  });

  it('reads a yaw alone', () => {
    expect(parseAvatarInspect('?avatar=1.57')).toEqual({ yaw: 1.57, mode: null, time: null });
  });

  it('reads a clip and a frozen time', () => {
    expect(parseAvatarInspect('?avatar=0,walk,0.18')).toEqual({ yaw: 0, mode: 'walk', time: 0.18 });
  });

  it('ignores an unknown clip and a bad yaw', () => {
    expect(parseAvatarInspect('?avatar=0,dance')).toEqual({ yaw: 0, mode: null, time: null });
    expect(parseAvatarInspect('?avatar=left')).toBeNull();
  });
});
