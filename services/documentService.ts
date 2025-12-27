
export interface DocumentChunk {
  page: number;
  content: string;
  totalLength: number;
}

/**
 * Simula a extração de texto de um arquivo (PDF/Imagem) de forma assíncrona.
 * Implementa chunking para evitar estouro de tokens em arquivos gigantes.
 */
export const processDocumentAsync = async (fileData: string, mimeType: string): Promise<DocumentChunk[]> => {
  // Simulando latência de processamento de OCR/Parsing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const decoded = atob(fileData);
  const totalLength = decoded.length;
  const chunkSize = 8000; // ~2k tokens por página
  const chunks: DocumentChunk[] = [];
  
  for (let i = 0; i < totalLength; i += chunkSize) {
    chunks.push({
      page: Math.floor(i / chunkSize) + 1,
      content: decoded.slice(i, i + chunkSize),
      totalLength
    });
  }
  
  return chunks;
};

export const getSmartDocumentPrompt = (chunks: DocumentChunk[], activePage: number = 1) => {
  const current = chunks.find(c => c.page === activePage);
  if (!current) return "";

  return `
[MCP_SYSTEM: DOCUMENT_READER_V2]
ARQUIVO DETECTADO (Tamanho Total: ${current.totalLength} bytes)
ESTADO: Paginado (${activePage}/${chunks.length})
CONTEÚDO DA PÁGINA ${activePage}:
---
${current.content}
---
NOTA: Se precisar de informações que não estão acima, você pode pedir explicitamente: "leia a página X do documento".
`;
};
