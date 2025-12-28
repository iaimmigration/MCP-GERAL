
export interface DocumentChunk {
  page: number;
  content: string;
  totalLength: number;
}

/**
 * Helper para preparar metadados de documentos.
 * O processamento de OCR real agora é feito nativamente pelo Gemini Vision.
 */
export const prepareDocumentMetadata = (file: File): string => {
  return `[ATTACHMENT_SCAN] Nome: ${file.name} | Tipo: ${file.type} | Tamanho: ${file.size} bytes. O conteúdo será analisado visualmente pelo kernel Gemini.`;
};
