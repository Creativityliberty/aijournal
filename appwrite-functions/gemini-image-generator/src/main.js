import { GoogleGenAI } from '@google/genai';
import { getStaticFile, throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
  throwIfMissing(process.env, ['GEMINI_API_KEY']);

  if (req.method === 'GET') {
    return res.text(getStaticFile('index.html'), 200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
  }

  try {
    throwIfMissing(req.body, ['prompt']);
  } catch (err) {
    return res.json({ ok: false, error: err.message }, 400);
  }

  const { prompt, aspectRatio = '1:1' } = req.bodyJson;

  log(`Generating image with prompt: ${prompt}`);
  log(`Aspect ratio: ${aspectRatio}`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'imagen-4.0-generate-001';

  try {
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      const base64Image = `data:image/jpeg;base64,${imageBytes}`;

      log('Image generated successfully');

      return res.json(
        {
          ok: true,
          image: base64Image,
          mimeType: 'image/jpeg',
        },
        200
      );
    }

    throw new Error('No image generated');
  } catch (err) {
    error('Failed to generate image:', err);
    return res.json(
      {
        ok: false,
        error: 'Failed to generate image.',
        details: err.message,
      },
      500
    );
  }
};
