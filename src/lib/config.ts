import { z } from 'zod';

// Client-side visible configuration
const clientConfigSchema = z.object({
  NOTION_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
});

// Server-side only configuration
const serverConfigSchema = z.object({
  NOTION_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
});

function getConfig() {
  const isServer = typeof window === 'undefined';
  const config = {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  };

  // Use different validation schema based on environment
  const schema = isServer ? serverConfigSchema : clientConfigSchema;
  const result = schema.safeParse(config);

  if (!result.success) {
    if (isServer) {
      throw new Error(
        `Missing required environment variables: ${result.error.errors
          .map((error) => error.path.join('.'))
          .join(', ')}`
      );
    }
    // Don't throw on client side, just return partial config
    return clientConfigSchema.parse({
      NOTION_TOKEN: process.env.NOTION_TOKEN,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    });
  }

  return result.data;
}

export const config = getConfig();
