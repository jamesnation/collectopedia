# User Roles in Collectopedia

Collectopedia supports different user roles to manage access control within the application.

## Available Roles

- **free**: Default role for all new users. Limited features access.
- **pro**: Paid subscription role with access to premium features.
- **admin**: Administrator role with full access to application features, including user management.

## Setting Roles

### Free and Pro Roles

- **Free**: Default role for new users
- **Pro**: Automatically assigned when a user subscribes to premium features through Stripe

### Admin Role

Admin roles need to be set manually in the database. This cannot be done through the web interface for security reasons.

To set a user as an admin:

1. Access your Supabase dashboard
2. Go to the "Table Editor" section
3. Select the "profiles" table
4. Find the user's profile by their user ID
5. Change the "membership" value from "free" or "pro" to "admin"
6. Save the changes

## Role-Based Access Control

The application performs access control checks based on the user's role:

- **Free users**: Basic access to core features
- **Pro users**: Access to all features except administrative functions
- **Admin users**: Full access to all features including user management and system configuration

## Checking for Admin Role in Code

For developers extending the application, you can check for the admin role using:

```typescript
const isAdmin = profile.membership === 'admin';

// Alternatively, in auth-protected routes:
const session = auth();
const metadata = session.sessionClaims?.metadata as { role?: string } || {};
const isAdmin = metadata.role === 'admin';
```

Remember to always implement proper access control checks in your code to maintain application security. 