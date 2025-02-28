import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './lib/locales/en.json';
import zhTranslation from './lib/locales/zh.json';
import jaTranslation from './lib/locales/ja.json';

// 翻译文件或对象
const resources = {
    en: {
        translation: enTranslation
    },
    zh: {
        translation: zhTranslation
    },
    ja: {
        translation: jaTranslation
    }
};

i18n
    .use(initReactI18next) // 将 i18n 传递给 react-i18next
    .init({
        resources,
        lng: 'en', // 默认语言
        fallbackLng: 'en', // 如果找不到翻译，则使用的备用语言
        interpolation: {
            escapeValue: false // React 已经处理了转义
        }
    });

export default i18n;