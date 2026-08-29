import { useEffect } from 'react';
import { pageTitle } from '@/shared/lib/seo';

/**
 * Tytuł karty przeglądarki per ekran. Celowo UX-owy (karta/historia), nie
 * SEO-owy — scrapery social nie wykonują JS; statyczny head w index.html
 * (ADR-0036) niesie meta dla crawlerów.
 */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = pageTitle(page);
  }, [page]);
}
