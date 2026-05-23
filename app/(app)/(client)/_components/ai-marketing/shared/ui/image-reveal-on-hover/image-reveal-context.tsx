'use client';

import { createContext, useContext } from 'react';

export type ImageRevealContextType = {
  revealImage: (src: string) => void;
};

export const ImageRevealContext = createContext<ImageRevealContextType | null>(null);

export const useImageReveal = () => {
  const context = useContext(ImageRevealContext);

  if (!context) {
    throw new Error('RevealItem must be used inside ImageReveal');
  }

  return context;
};
