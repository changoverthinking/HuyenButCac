const PDFJS_VERSION = "6.2.108";
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export type PdfViewport = { width: number; height: number };
export type PdfRenderTask = { promise: Promise<void>; cancel: () => void };
export type PdfPageHandle = {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
    transform?: [number, number, number, number, number, number];
  }) => PdfRenderTask;
};
export type PdfDocumentHandle = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageHandle>;
  destroy: () => Promise<void>;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PdfDocumentHandle> };
};

let runtimePromise: Promise<PdfJsModule> | null = null;

export async function loadPdfRuntime(): Promise<PdfJsModule> {
  runtimePromise ??= import(/* @vite-ignore */ PDFJS_MODULE_URL) as Promise<PdfJsModule>;
  const runtime = await runtimePromise;
  runtime.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  return runtime;
}
