import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SeoMeta {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

interface SeoContextValue {
  meta: SeoMeta | null;
  setSeo: (meta: SeoMeta | null) => void;
  clearSeo: () => void;
}

const SeoContext = createContext<SeoContextValue | null>(null);

export const SeoProvider = ({ children }: { children: ReactNode }) => {
  const [meta, setMeta] = useState<SeoMeta | null>(null);
  const setSeo = useCallback((m: SeoMeta | null) => setMeta(m), []);
  const clearSeo = useCallback(() => setMeta(null), []);
  return (
    <SeoContext.Provider value={{ meta, setSeo, clearSeo }}>
      {children}
    </SeoContext.Provider>
  );
};

export const useSeo = () => {
  const ctx = useContext(SeoContext);
  if (!ctx) throw new Error('useSeo must be used within SeoProvider');
  return ctx;
};
