import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import deDE from './locales/de-DE.json';
import jaJP from './locales/ja-JP.json';
import ruRU from './locales/ru-RU.json';
import koKR from './locales/ko-KR.json';
import frFR from './locales/fr-FR.json';
import arSA from './locales/ar-SA.json';
import zhCNDocs from './locales/docs/zh-CN.json';
import enUSDocs from './locales/docs/en-US.json';
import deDEDocs from './locales/docs/de-DE.json';
import jaJPDocs from './locales/docs/ja-JP.json';
import ruRUDocs from './locales/docs/ru-RU.json';
import koKRDocs from './locales/docs/ko-KR.json';
import frFRDocs from './locales/docs/fr-FR.json';
import arSADocs from './locales/docs/ar-SA.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': {
        translation: zhCN.translation,
        docs: zhCNDocs
      },
      'en-US': {
        translation: enUS.translation,
        docs: enUSDocs
      },
      'de-DE': {
        translation: deDE.translation,
        docs: deDEDocs
      },
      'ja-JP': {
        translation: jaJP.translation,
        docs: jaJPDocs
      },
      'ru-RU': {
        translation: ruRU.translation,
        docs: ruRUDocs
      },
      'ko-KR': {
        translation: koKR.translation,
        docs: koKRDocs
      },
      'fr-FR': {
        translation: frFR.translation,
        docs: frFRDocs
      },
      'ar-SA': {
        translation: arSA.translation,
        docs: arSADocs
      }
    },
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;