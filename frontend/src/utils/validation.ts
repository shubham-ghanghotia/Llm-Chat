import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  return { isValid: true };
};

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.USERNAME_TOO_SHORT };
  }
  
  if (username.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.USERNAME_TOO_LONG };
  }
  
  return { isValid: true };
};

// Message validation
export const validateMessage = (message: string): ValidationResult => {
  if (!message.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (message.length > 10000) {
    return { isValid: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
  }
  
  return { isValid: true };
};

// Form validation
export const validateForm = (data: Record<string, string>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(data).forEach(field => {
    const value = data[field];
    
    switch (field) {
      case 'email':
        const emailValidation = validateEmail(value);
        if (!emailValidation.isValid) {
          errors[field] = emailValidation.error!;
        }
        break;
        
      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          errors[field] = passwordValidation.error!;
        }
        break;
        
      case 'username':
        const usernameValidation = validateUsername(value);
        if (!usernameValidation.isValid) {
          errors[field] = usernameValidation.error!;
        }
        break;
        
      case 'message':
        const messageValidation = validateMessage(value);
        if (!messageValidation.isValid) {
          errors[field] = messageValidation.error!;
        }
        break;
        
      default:
        if (!value.trim()) {
          errors[field] = ERROR_MESSAGES.REQUIRED_FIELD;
        }
    }
  });
  
  return errors;
};

// Check if form is valid
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};
