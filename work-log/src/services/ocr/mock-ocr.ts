import { OCRProvider, OCRResult } from "./types";

/**
 * Mock OCR Provider
 *
 * This provider simulates OCR by allowing the developer to manually input
 * what text would have been recognized. Used for development and testing
 * when no real OCR API key is available.
 *
 * IMPORTANT: Browser-based OCR on messy Chinese handwriting has limited accuracy.
 * For production, use a cloud service with Chinese handwriting recognition support.
 */
export class MockOCRProvider implements OCRProvider {
  readonly name = "mock";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recognize(_imageDataUrl: string): Promise<OCRResult> {
    // In mock mode, we return a placeholder that the user will replace
    // with the actual text they wrote
    return {
      text: "",
      confidence: 0,
      raw: JSON.stringify({
        provider: "mock",
        note: "Mock OCR - text must be manually entered",
      }),
    };
  }

  /**
   * Simulate a recognition result with a given text.
   * Used by the UI when the user manually types what they wrote.
   */
  async recognizeWithText(text: string): Promise<OCRResult> {
    return {
      text,
      confidence: 1.0,
      raw: JSON.stringify({
        provider: "mock",
        text,
        note: "Manually entered text simulating OCR",
      }),
    };
  }
}