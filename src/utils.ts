import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LANG } from "./constant/language";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidJSONObject(str: string) {
  if (typeof str !== 'string' || str.trim() === '') {
    return false;
  }

  try {
    const parsed = JSON.parse(str);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
}

export function getLanguage() {
  const windowLanguage = window.navigator.language;
  let lang: 'zh' | 'en' | 'ja' = 'en';
  if (["en-US", "zh-CN", "ja-JP"].includes(windowLanguage)) {
    // @ts-ignore
    lang = LANG[windowLanguage]
  } else if (["en", "zh", "ja"].includes(windowLanguage)) {
    // @ts-ignore
    lang = windowLanguage
  }
  const localStorageLanguage = localStorage.getItem('language')
  if (localStorageLanguage) lang = localStorageLanguage as 'zh' | 'en' | 'ja';
  const searchLang = new URLSearchParams(window.location.search).get('lang')
  if (searchLang) {
    // @ts-ignore
    if (["en-US", "zh-CN", "ja-JP"].includes(searchLang)) lang = LANG[searchLang];
    // @ts-ignore
    else if (["en", "zh", "ja"].includes(searchLang)) lang = searchLang
    else lang = 'en'
  }
  localStorage.setItem('language', lang)
  return lang;
}