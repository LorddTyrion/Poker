import local from '../assets/local.json';

interface Translation {
    [key: string]: string;
  }
  
interface Translations {
hu: Translation;
en: Translation;
}
const DEFAULT_LANGUAGE: 'hu' = 'hu';

const SUPPORTED_LANGUAGES: string[] = ['hu', 'en'];

const TRANSLATIONS: Translations = local;

  export const translate = 
             (key: string, customLang?: 'hu' | 'en'): string => {
  const lang: string | undefined = customLang || DEFAULT_LANGUAGE;
  return TRANSLATIONS[lang !== undefined 
                      && SUPPORTED_LANGUAGES.includes(lang) ? 
                         lang : DEFAULT_LANGUAGE][key];
};

export const parseParamTranslate = (key: string, custom_lang?: 'hu' | 'en', ...params: any[]) => {
  const translated = translate(key, custom_lang);
  if(!translated) return "";
  return translated.replace(/\$(\d+)/g, (_, index) => {
    const i = parseInt(index);
    if (i >= 0 && i < params.length) {
      return params[i].toString();
    }
    return '';
  });
};