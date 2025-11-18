# 🎨 Gemini Image Generator Function

Generate images using Google's Gemini Imagen 4.0 model.

## 🧰 Usage

### GET /

HTML form for interacting with the function.

### POST /

Generate an image from a text prompt.

**Parameters**

| Name         | Description                          | Location | Type               | Sample Value                     |
| ------------ | ------------------------------------ | -------- | ------------------ | -------------------------------- |
| Content-Type | The content type of the request body | Header   | `application/json` | N/A                              |
| prompt       | Text description of the image        | Body     | String             | `A serene mountain lake at sunset` |
| aspectRatio  | Image aspect ratio (optional)        | Body     | String             | `1:1`, `16:9`, `9:16`, `4:3`     |

Sample `200` Response:

Response with base64 encoded image.

```json
{
  "ok": true,
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg"
}
```

Sample `400` Response:

Response when the request body is missing.

```json
{
  "ok": false,
  "error": "Missing body with a prompt."
}
```

Sample `500` Response:

Response when the model fails to respond.

```json
{
  "ok": false,
  "error": "Failed to generate image."
}
```

## ⚙️ Configuration

| Setting           | Value         |
| ----------------- | ------------- |
| Runtime           | Node (18.0)   |
| Entrypoint        | `src/main.js` |
| Build Commands    | `npm install` |
| Permissions       | `any`         |
| Timeout (Seconds) | 30            |

## 🔒 Environment Variables

### GEMINI_API_KEY

A unique key used to authenticate with the Google Gemini API.

| Question      | Answer                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Required      | Yes                                                                         |
| Sample Value  | `AIzaSy...vcy`                                                              |
| Documentation | [Gemini API Docs](https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=node) |

### GEMINI_MODEL

The Gemini model to use for image generation. Default is `imagen-4.0-generate-001`.

| Question      | Answer                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Required      | No                                                                          |
| Sample Value  | `imagen-4.0-generate-001`                                                   |
| Documentation | [Gemini Models](https://ai.google.dev/gemini-api/docs/models/gemini) |
