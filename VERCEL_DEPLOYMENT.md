# Vercel Deployment Guide

This guide explains how to deploy your media processing application to Vercel.

## Important Limitations

⚠️ **Before deploying to Vercel, be aware of these limitations:**

1. **Model Size Limits**: The Whisper base model (~140MB) and Demucs model are large. Vercel has a 50MB deployment size limit for serverless functions. You may need to:
   - Use a smaller Whisper model (tiny or small)
   - Consider Vercel Pro plan (250MB limit)
   - Use external model hosting

2. **Execution Time Limits**:
   - Hobby plan: 10 seconds
   - Pro plan: 60 seconds  
   - Enterprise: 900 seconds
   
   Media processing can exceed these limits. Consider using Vercel's Edge Functions or external processing services.

3. **File Storage**: Vercel's serverless functions use `/tmp` directory which is:
   - Ephemeral (cleared between invocations)
   - Limited to 500MB
   - Not suitable for persistent storage
   
   For production, integrate with cloud storage (S3, Cloudinary, etc.)

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Required Package.json Changes

Since package.json cannot be automatically modified, you need to manually add this build script:

```json
{
  "scripts": {
    "vercel-build": "vite build && esbuild api/index.ts --platform=node --packages=external --bundle --format=esm --outdir=api --outfile=api/index.js"
  }
}
```

## Environment Variables

Set these environment variables in your Vercel dashboard:

1. **KURDISH_TTS_API_KEY** - Your Kurdish TTS API key
2. **DATABASE_URL** (optional) - If using PostgreSQL
3. **NODE_ENV** - Set to "production"
4. **VERCEL** - Automatically set by Vercel to "1"

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/client`
4. Add environment variables
5. Click "Deploy"

### Option 2: Deploy via CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy from your project directory:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your project

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Python Dependencies

Vercel supports Python runtime for serverless functions. The `whisper_transcribe.py` script will work, but you need to ensure:

1. Create `api/requirements.txt` with Python dependencies:
   ```
   deep-translator>=1.11.4
   openai-whisper>=20250625
   pydub>=0.25.1
   requests>=2.32.5
   torch>=2.8.0
   demucs>=4.0.1
   ```

2. Or create a Python serverless function in `api/` directory

⚠️ **Note**: Large Python packages like Whisper and Demucs may exceed Vercel's size limits. Consider:
- Using Whisper API services instead
- Deploying Python processing to a separate service (AWS Lambda, Google Cloud Functions)
- Using Vercel's Edge Runtime with smaller models

## FFmpeg on Vercel

Vercel includes FFmpeg in the serverless environment. Your `fluent-ffmpeg` code should work without modifications.

## File Upload Handling

The code has been modified to use `/tmp` directory when running on Vercel:

```typescript
const uploadsDir = process.env.VERCEL ? "/tmp/uploads" : "uploads";
const outputsDir = process.env.VERCEL ? "/tmp/outputs" : "outputs";
```

**Important**: Files in `/tmp` are ephemeral. For production:

1. Stream uploads directly to cloud storage
2. Process and return results immediately
3. Don't rely on file persistence between requests

## Testing Locally

Test the Vercel build locally:

```bash
vercel dev
```

This runs your application in a Vercel-like environment.

## Post-Deployment

After deployment:

1. Test the `/api/upload` endpoint with a small media file
2. Monitor function execution time and memory usage
3. Check Vercel logs for any errors
4. Set up error monitoring (Sentry, etc.)

## Recommended Optimizations

For better Vercel compatibility:

1. **Use External Services**:
   - Whisper API (AssemblyAI, Deepgram)
   - Cloud storage (AWS S3, Cloudinary)
   - Background job processing (Vercel Cron, Inngest)

2. **Reduce Function Size**:
   - Use Whisper tiny model instead of base
   - Remove Demucs if not essential
   - Externalize heavy processing

3. **Implement Queue System**:
   - Accept upload
   - Queue processing job
   - Return job ID
   - Poll for results

## Alternative: Vercel + External Processing

Recommended architecture:

1. Vercel hosts the frontend and API
2. API accepts uploads and queues jobs
3. External worker (AWS Lambda, Railway, etc.) processes media
4. Results stored in cloud storage
5. Frontend polls or receives webhook notification

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `api/index.js` is being created
- Verify all TypeScript compiles

### Function Timeout
- Reduce media file size limits
- Use smaller AI models
- Implement async processing

### Module Not Found
- Ensure all imports use correct paths
- Check `package.json` dependencies
- Verify build output includes all files

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

For this application:
- Check deployment logs
- Verify environment variables
- Test with smaller files first
