
import * as pdfjsLib from 'pdfjs-dist';
import { PageData, TextItem } from '../types';

const PDFJS_VERSION = '4.0.379';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

export const renderPdfPages = async (file: File): Promise<{ pages: PageData[], totalPages: number }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: PageData[] = [];

    const pagesToRender = Math.min(totalPages, 150);

    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const scale = 2.0; 
      const viewport = page.getViewport({ scale });
      
      const textContentObj = await page.getTextContent();
      const textItems: TextItem[] = textContentObj.items.map((item: any) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height
      }));

      const textContent = textItems.map(t => t.str).join(' ');

      const canvas = document.createElement('canvas');
      // Ensure alpha is false to prevent transparency artifacts
      const context = canvas.getContext('2d', { alpha: false });

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Force solid white background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        pages.push({
          imageUrl,
          pageNumber: i,
          textContent,
          textItems,
          width: viewport.width,
          height: viewport.height
        });
      }
      page.cleanup();
    }

    return { pages, totalPages: pagesToRender };
  } catch (error) {
    console.error("PDF Rendering Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to load PDF");
  }
};
