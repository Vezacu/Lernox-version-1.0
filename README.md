# Lernox, Integrated College Management System

This is a comprehensive college management system built with Next.js, Prisma, and PostgreSQL. The system helps manage students, teachers, courses, attendance, and more in an educational institution.


### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/college_management_db"

# Clerk Authentication (replace with your actual keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Cloudinary (if using image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholder values with your actual credentials.

### 3. Set Up the Database

Initialize the database with Prisma:

```bash
npx prisma migrate dev --name init
```

This command will:
- Create the database if it doesn't exist
- Apply all migrations
- Generate the Prisma client

### 4. Seed the Database (Optional)

If you want to populate the database with initial data:

```bash
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 6. Build for Production

When you're ready to deploy:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Database Management

### View Database

```bash
npx prisma studio
```

This opens a web interface to browse and manage your database at [http://localhost:5555](http://localhost:5555).

### Update Database Schema

After making changes to the `schema.prisma` file:

```bash
npx prisma migrate dev --name <descriptive-name>
```

### Generate Prisma Client

If you only need to update the Prisma client without creating a migration:

```bash
npx prisma generate
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify your DATABASE_URL in the .env file
- Check that your database user has the necessary permissions

### Authentication Problems

- Verify your Clerk API keys
- Ensure the Clerk URLs are correctly configured

### Deployment Issues

- Make sure all environment variables are set in your production environment
- Run `npm run build` before deploying to ensure the application builds successfully

## License

All rights reserved.

This project was developed as part of an academic submission. 
Unauthorized reproduction or distribution of this project or any part of it is strictly prohibited.

## Contact
```bash
Phone no. : +91 9863080890
Email : vezacudawhuoyt@gmail.com
```

