import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY: string =
  ((import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || '').trim();

export const isTurnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile load failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Impossible de charger Cloudflare Turnstile'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  resetSignal?: number;
}

/**
 * Widget Cloudflare Turnstile affiché uniquement lorsque VITE_TURNSTILE_SITE_KEY est configuré.
 */
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onToken, resetSignal = 0 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!isTurnstileEnabled || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          size: 'flexible',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current('');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isTurnstileEnabled || resetSignal === 0) return;
    onTokenRef.current('');
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // ignore reset errors
      }
    }
  }, [resetSignal]);

  if (!isTurnstileEnabled) return null;

  return <div ref={containerRef} className="flex justify-center my-2 min-h-[65px]" />;
};
