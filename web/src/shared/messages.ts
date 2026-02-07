export const MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    sessionExpired: 'Your session has expired. Please sign in again',
    accessDenied: 'You do not have permission to access this resource',
  },

  conversation: {
    notFound: 'Conversation not found',
    notAssigned: 'You are not assigned to this conversation',
    created: 'Conversation created successfully',
    archived: 'Conversation archived',
  },

  message: {
    sent: 'Message sent',
    empty: 'Message content cannot be empty',
  },

  lead: {
    notFound: 'Lead not found',
    created: 'Lead created successfully',
    updated: 'Lead updated successfully',
  },

  user: {
    notFound: 'User not found',
    emailTaken: 'A user with this email already exists',
  },

  general: {
    serverError: 'Something went wrong. Please try again',
    validationError: 'Please check the form for errors',
  },
} as const;
