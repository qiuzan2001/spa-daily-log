export interface OCRResult {
  text: string;
  confidence: number;
  raw?: string;
}

export interface OCRProvider {
  readonly name: string;
  recognize(imageDataUrl: string): Promise<OCRResult>;
}