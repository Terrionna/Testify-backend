// Sets the environment variables the app reads, so tests never need a real .env file.
process.env.JWT_SECRET = 'test-secret-only-for-tests';