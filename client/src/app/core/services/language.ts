import { Injectable, signal } from '@angular/core';

import arTranslations from '../../../assets/i18n/ar.json';
import enTranslations from '../../../assets/i18n/en.json';

export type LanguageCode = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<LanguageCode>(this.readLanguage());
  readonly isArabic = signal(this.language() === 'ar');

  private readonly dictionaries = {
    en: enTranslations,
    ar: arTranslations,
  } as const;

  init(): void {
    this.applyLanguage(this.language());
  }

  setLanguage(language: LanguageCode): void {
    this.language.set(language);
    this.isArabic.set(language === 'ar');
    localStorage.setItem('nexora-language', language);
    this.applyLanguage(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.language() === 'ar' ? 'en' : 'ar');
  }

  categoryName(name: string): string {
    const key = name
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const path = `categoryNames.${key}`;
    const translated = this.t(path);
    return translated === path ? name : translated;
  }

  t(path: string, params?: Record<string, string | number | null | undefined>): string {
    const fallback = this.resolve(path, this.dictionaries.en);
    const current = this.resolve(path, this.dictionaries[this.language()]);
    const value = current ?? fallback ?? path;
    if (typeof value !== 'string') {
      return path;
    }

    if (!params) {
      return value;
    }

    return Object.entries(params).reduce((result, [key, replacement]) => {
      return result.replaceAll(
        `{{${key}}}`,
        `\u2068${String(replacement ?? '')}\u2069`,
      );
    }, value);
  }

  private applyLanguage(language: LanguageCode): void {
    const doc = document.documentElement;
    doc.lang = language;
    doc.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' ? 'Zad' : 'Zad';
    doc.classList.toggle('rtl', language === 'ar');
    doc.classList.toggle('ltr', language !== 'ar');
    document.body.dir = doc.dir;
  }

  private readLanguage(): LanguageCode {
    const stored = localStorage.getItem('nexora-language');
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  }

  private resolve<T>(path: string, source: Record<string, unknown>): T | undefined {
    return path.split('.').reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, source) as T | undefined;
  }
}
