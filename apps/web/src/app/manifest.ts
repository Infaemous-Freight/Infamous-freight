import { readFileSync } from 'fs';
import type { MetadataRoute } from 'next';
import { join } from 'path';

const fallbackManifest: MetadataRoute.Manifest = {
  name: 'Infamous Freight',
  short_name: 'Infamous Freight',
  description: 'AI-powered freight and logistics automation platform.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0f172a',
  theme_color: '#0f172a',
  orientation: 'portrait',
  categories: ['business', 'productivity', 'logistics'],
  icons: [
    {
      src: '/icon',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/apple-icon',
      sizes: '180x180',
      type: 'image/png',
    },
  ],
};

export default function manifest(): MetadataRoute.Manifest {
  try {
    const manifestPath = join(process.cwd(), 'public', 'manifest.webmanifest');
    const manifestContents = readFileSync(manifestPath, 'utf8');

    return JSON.parse(manifestContents) as MetadataRoute.Manifest;
  } catch {
    return fallbackManifest;
  }
}
