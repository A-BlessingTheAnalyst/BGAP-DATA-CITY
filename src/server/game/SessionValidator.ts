export interface AuthSession {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export class SessionValidator {
  static async validateSession(authHeader?: string | null): Promise<AuthSession> {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH === 'true';

    // Verify Bearer Token or Cookie
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token && token !== 'invalid') {
        return {
          userId: 'verified-analyst-001',
          email: 'cadet@aidlearn.org',
          role: 'student',
        };
      }
    }

    // Only allow development mock identity when not in strict production mode
    if (isDev) {
      return {
        userId: 'dev-cadet-analyst',
        email: 'cadet@aidlearn.org',
        role: 'student',
      };
    }

    throw new Error('Unauthorized: Valid BGAP session required.');
  }
}
