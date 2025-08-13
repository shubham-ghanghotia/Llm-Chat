import { config } from 'dotenv';

config();

export const validateEnvironment = () => {
  const requiredVars = [
    'PORT',
    'NODE_ENV'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate port
  const port = parseInt(process.env.PORT || '4000');
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV || '')) {
    throw new Error(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  console.log('✅ Environment validation passed');
};
