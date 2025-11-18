# 🚀 Deploying Gemini Image Generator to Appwrite

## Step 1: Create the Function in Appwrite Console

1. Go to your Appwrite Console: https://cloud.appwrite.io/
2. Navigate to **Functions** in the left sidebar
3. Click **Create function**
4. Configure the function:
   - **Name:** `gemini-image-generator`
   - **Runtime:** `Node.js 18.0`
   - **Entrypoint:** `src/main.js`
   - **Build Commands:** `npm install`
   - **Execute Access:** `Any` (or specific roles as needed)
   - **Timeout:** `30` seconds

## Step 2: Set Environment Variables

In the function settings, add these environment variables:

### Required
- **GEMINI_API_KEY**
  - Value: Your Gemini API key (e.g., `AIzaSy...`)
  - Get it from: https://ai.google.dev/gemini-api/docs/api-key

### Optional
- **GEMINI_MODEL**
  - Value: `imagen-4.0-generate-001` (default)
  - Other options: Check Gemini docs for available models

## Step 3: Deploy the Code

### Option A: Using Appwrite CLI

```bash
# Install Appwrite CLI
npm install -g appwrite

# Login to Appwrite
appwrite login

# Navigate to function directory
cd appwrite-functions/gemini-image-generator

# Deploy
appwrite functions createDeployment \
  --functionId=[FUNCTION_ID] \
  --activate=true \
  --entrypoint="src/main.js" \
  --code="."
```

### Option B: Using Git Integration

1. In Appwrite Console → Functions → Your Function
2. Go to **Settings** → **Git**
3. Connect your GitHub repository
4. Set the **Root Directory:** `appwrite-functions/gemini-image-generator`
5. Set **Branch:** `main`
6. Enable **Automatic Deployments**
7. Click **Save**

### Option C: Manual Upload (ZIP)

1. Create a ZIP file of the `gemini-image-generator` directory
2. In Appwrite Console → Functions → Your Function → **Deployments**
3. Click **Create deployment**
4. Upload the ZIP file
5. Set **Entrypoint:** `src/main.js`
6. Click **Create**
7. Once built, click **Activate** on the deployment

## Step 4: Get the Function URL

After deployment:
1. Go to your function in Appwrite Console
2. Copy the **Domain** URL (e.g., `https://[PROJECT_ID].appwrite.global/v1/functions/[FUNCTION_ID]/executions`)

## Step 5: Test the Function

### Using the Web Interface
Visit the function URL in your browser to see the testing interface.

### Using cURL
```bash
curl -X POST \
  https://[PROJECT_ID].appwrite.global/v1/functions/[FUNCTION_ID]/executions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain lake at sunset",
    "aspectRatio": "16:9"
  }'
```

### Using JavaScript
```javascript
import { Client, Functions } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('[PROJECT_ID]');

const functions = new Functions(client);

const result = await functions.createExecution(
  '[FUNCTION_ID]',
  JSON.stringify({
    prompt: 'A serene mountain lake at sunset',
    aspectRatio: '16:9'
  }),
  false
);

console.log(result);
```

## Step 6: Integrate with Your App

Update your AI Journal app to use the Appwrite Function instead of direct API calls:

```typescript
// services/geminiService.ts
import { Client, Functions } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const functions = new Functions(client);

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const execution = await functions.createExecution(
      'gemini-image-generator', // Function ID
      JSON.stringify({ prompt, aspectRatio: '1:1' }),
      false
    );

    const response = JSON.parse(execution.responseBody);

    if (!response.ok) {
      throw new Error(response.error || 'Failed to generate image');
    }

    return response.image; // Base64 image data
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};
```

## Benefits of Using Appwrite Functions

✅ **Security:** API keys stay on the server
✅ **Scalability:** Automatic scaling with Appwrite
✅ **Monitoring:** Built-in logs and analytics
✅ **Reliability:** Retry logic and error handling
✅ **Cost Control:** Track usage and set limits

## Troubleshooting

### Build Fails
- Check that `package.json` dependencies are correct
- Ensure Node.js version is 18.0+
- Verify `src/main.js` path is correct

### Runtime Errors
- Check environment variables are set correctly
- Verify Gemini API key is valid
- Check function logs in Appwrite Console

### Image Generation Fails
- Ensure Imagen API is enabled in Google Cloud Console
- Check billing is enabled for Gemini API
- Verify API key has proper permissions

## Next Steps

- Add rate limiting to prevent abuse
- Implement caching for repeated prompts
- Add image storage to Appwrite Storage
- Create webhooks for async processing
- Monitor costs and usage patterns
