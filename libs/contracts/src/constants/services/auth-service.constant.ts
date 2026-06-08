export const AUTH_SERVICE = {
  NAME: 'AUTH_SERVICE',
  ACTIONS: {
    PING: 'auth.ping',

    // Registration & Login
    REGISTER: 'auth.register',
    LOGIN: 'auth.login',
    LOGOUT: 'auth.logout',

    // Token management
    REFRESH_TOKEN: 'auth.refresh_token',
    VERIFY_TOKEN: 'auth.verify_token',

    // Email verification
    SEND_VERIFICATION_EMAIL: 'auth.send_verification_email',
    VERIFY_EMAIL: 'auth.verify_email',

    // Password reset
    FORGOT_PASSWORD: 'auth.forgot_password',
    RESET_PASSWORD: 'auth.reset_password',
    CHANGE_PASSWORD: 'auth.change_password',
  },
};
