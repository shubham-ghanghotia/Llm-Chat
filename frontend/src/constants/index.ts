// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_SERVER_URL || 'http://localhost:4000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      LOGOUT: '/api/auth/logout',
    },
    CHAT: {
      BASE: '/api/chats',
      MESSAGES: '/api/chats/:chatId/messages',
    },
  },
  TIMEOUT: 10000,
} as const;

// Socket Configuration
export const SOCKET_CONFIG = {
  EVENTS: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    AUTH_ERROR: 'auth_error',
    CHAT_WITH_LLM: 'chat-with-llm',
    LLM_TYPING_START: 'llm-typing-start',
    LLM_TYPING_END: 'llm-typing-end',
    LLM_RESPONSE_CHUNK: 'llm-response-chunk',
    LLM_RESPONSE_END: 'llm-response-end',
    LLM_RESPONSE_ERROR: 'llm-response-error',
    CHAT_CREATED: 'chat-created',
    USER_CHATS: 'user-chats',
    CHAT_DELETED: 'chat-deleted',
  },
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  CHATS: 'chats',
  THEME: 'theme',
  SETTINGS: 'settings',
} as const;

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  TYPING_INDICATOR_DELAY: 100,
  MESSAGE_PREVIEW_LENGTH: 50,
  MAX_INPUT_HEIGHT: 200,
  TOAST_DURATION: 4000,
  TOAST_SUCCESS_DURATION: 3000,
  TOAST_ERROR_DURATION: 5000,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGES_PER_CHAT: 100,
  MESSAGE_ID_PREFIX: 'msg_',
  CHAT_ID_PREFIX: 'chat_',
  DEFAULT_CHAT_TITLE: 'New Chat',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_ALREADY_EXISTS: 'User with this email or username already exists.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long.',
  USERNAME_TOO_LONG: 'Username must be less than 20 characters.',
  MESSAGE_TOO_LONG: 'Message is too long.',
  CHAT_CREATION_FAILED: 'Failed to create chat.',
  MESSAGE_SEND_FAILED: 'Failed to send message.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  CHAT_CREATED: 'Chat created successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  CHAT_DELETED: 'Chat deleted successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;
