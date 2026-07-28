import { OCRProvider, OCRResult } from "./types";
import { MockOCRProvider } from "./mock-ocr";

// Provider registry
const providers = new Map<string, OCRProvider>();

// Register built-in providers
const mockProvider = new MockOCRProvider();
providers.set("mock", mockProvider);

// Try to register Google Cloud Vision if API key is available
// This is a placeholder - actual implementation requires:
// npm install @google-cloud/vision
// and a valid Google Cloud service account key
if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VISION_API_KEY) {
  // Lazy-load to avoid import errors if package not installed
  try {
    // Dynamic import would go here:
    // const { GoogleCloudVisionProvider } = await import('./google-cloud-vision');
    // providers.set('google_cloud_vision', new GoogleCloudVisionProvider());
    console.log("Google Cloud Vision credentials detected");
  } catch {
    console.warn("Failed to load Google Cloud Vision provider");
  }
}

/**
 * Get the active OCR provider based on environment configuration.
 * Falls back to Mock OCR if no real provider is configured.
 */
export function getOCRProvider(): OCRProvider {
  const configuredProvider = process.env.OCR_PROVIDER || "mock";
  const provider = providers.get(configuredProvider);
  if (!provider) {
    console.warn(
      `OCR provider "${configuredProvider}" not found. Falling back to mock.`
    );
    return providers.get("mock")!;
  }
  return provider;
}

/**
 * Register a custom OCR provider.
 */
export function registerOCRProvider(name: string, provider: OCRProvider): void {
  providers.set(name, provider);
}

export type { OCRProvider, OCRResult };

/**
 * NOTE: Browser-based OCR on messy Chinese handwriting has limited accuracy.
 * For production use, we recommend integrating a cloud service that supports
 * Chinese handwriting recognition, such as:
 *
 * - Google Cloud Vision API (document_text_detection with language hint "zh")
 * - Azure AI Document Intelligence (Read model with Chinese language support)
 * - Tencent Cloud OCR (Handwriting OCR)
 * - Baidu OCR (Handwriting Recognition)
 *
 * To integrate a new provider:
 * 1. Create a new file in this directory (e.g., google-cloud-vision.ts)
 * 2. Implement the OCRProvider interface
 * 3. Register it in the provider registry above
 * 4. Set OCR_PROVIDER environment variable to the provider name
 */