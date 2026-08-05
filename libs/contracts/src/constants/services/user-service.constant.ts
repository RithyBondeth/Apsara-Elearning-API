export const USER_SERVICE = {
  NAME: 'USER_SERVICE',
  ACTIONS: {
    // Profile
    CREATE: 'user.create',
    FIND_ALL: 'user.find_all',
    FIND_ONE: 'user.find_one',
    FIND_BY_EMAIL: 'user.find_by_email',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
    UPDATE_AVATAR: 'user.update_avatar',

    // Gamification
    ADD_XP: 'user.add_xp',
    UPDATE_STREAK: 'user.update_streak',

    // Badges
    BADGE_FIND_ALL: 'user.badge.find_all',
    BADGE_FIND_ONE: 'user.badge.find_one',
    BADGE_CREATE: 'user.badge.create',
    BADGE_UPDATE: 'user.badge.update',
    BADGE_DELETE: 'user.badge.delete',
    BADGE_AWARD: 'user.badge.award',
    BADGE_REVOKE: 'user.badge.revoke',
    BADGE_FIND_BY_USER: 'user.badge.find_by_user',
  },
};
