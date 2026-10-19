/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useState, useEffect, useMemo} from 'preact/hooks';
import IntlMessageFormat from 'intl-messageformat';
import {Dropdown} from '../../components/dropdown';
import './lhr-locale.css';

/** @typedef {Record<string, {message: string}>} LhlMessages */

export const CANONICAL_LOCALES = [
  'ar',
  'bg',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en-GB',
  'en-US',
  'es',
  'es-419',
  'fi',
  'fil',
  'fr',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'nl',
  'no',
  'pl',
  'pt',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sr-Latn',
  'sv',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
  'zh',
  'zh-HK',
  'zh-TW',
];

/** @type {Record<string, string>} */
const LOCALE_ALIASES = {
  en: 'en-US',
  'en-AU': 'en-GB',
  'en-IE': 'en-GB',
  'en-IN': 'en-GB',
  'en-SG': 'en-GB',
  'en-ZA': 'en-GB',
  'es-AR': 'es-419',
  'es-BO': 'es-419',
  'es-BR': 'es-419',
  'es-BZ': 'es-419',
  'es-CL': 'es-419',
  'es-CO': 'es-419',
  'es-CR': 'es-419',
  'es-CU': 'es-419',
  'es-DO': 'es-419',
  'es-EC': 'es-419',
  'es-GT': 'es-419',
  'es-HN': 'es-419',
  'es-MX': 'es-419',
  'es-NI': 'es-419',
  'es-PA': 'es-419',
  'es-PE': 'es-419',
  'es-PR': 'es-419',
  'es-PY': 'es-419',
  'es-SV': 'es-419',
  'es-US': 'es-419',
  'es-UY': 'es-419',
  'es-VE': 'es-419',
  gsw: 'de',
  in: 'id',
  iw: 'he',
  mo: 'ro',
  nb: 'no',
  tl: 'fil',
};

/** @type {Record<string, LhlMessages>} */
const LOCALE_MESSAGES_CACHE = {};

const ICU_TYPE = {
  literal: 0,
  argument: 1,
  number: 2,
  plural: 6,
  pound: 7,
};

/** @type {Partial<import('intl-messageformat').Formats>} */
const ICU_FORMATS = {
  number: {
    bytes: {
      maximumFractionDigits: 0,
    },
    milliseconds: {
      maximumFractionDigits: 0,
    },
    seconds: {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    extendedPercent: {
      maximumFractionDigits: 2,
      style: 'percent',
    },
  },
};

/**
 * @param {string} locale
 * @return {string}
 */
export function resolveLocaleFile(locale) {
  if (LOCALE_ALIASES[locale]) return LOCALE_ALIASES[locale];
  if (CANONICAL_LOCALES.includes(locale)) return locale;
  const baseLang = locale.split('-')[0];
  if (LOCALE_ALIASES[baseLang]) return LOCALE_ALIASES[baseLang];
  if (CANONICAL_LOCALES.includes(baseLang)) return baseLang;
  return 'en-US';
}

/**
 * @param {string} locale
 * @param {LhlMessages} messages
 */
export function registerLocaleData(locale, messages) {
  LOCALE_MESSAGES_CACHE[locale] = messages;
  LOCALE_MESSAGES_CACHE[resolveLocaleFile(locale)] = messages;
}

/**
 * @param {string} locale
 * @return {Promise<LhlMessages>}
 */
export async function loadLocaleData(locale) {
  if (LOCALE_MESSAGES_CACHE[locale]) return LOCALE_MESSAGES_CACHE[locale];
  const localeFile = resolveLocaleFile(locale);
  if (LOCALE_MESSAGES_CACHE[localeFile]) return LOCALE_MESSAGES_CACHE[localeFile];

  const publicPath = process.env.PUBLIC_PATH || '/app/';
  const response = await fetch(`${publicPath}locales/${localeFile}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load locale data for ${locale}`);
  }
  const messages = await response.json();
  LOCALE_MESSAGES_CACHE[localeFile] = messages;
  LOCALE_MESSAGES_CACHE[locale] = messages;
  return messages;
}

/**
 * @param {string} pathAsString
 * @return {string[]}
 */
function parseLhrPath(pathAsString) {
  /** @type {string[]} */
  const parts = [];
  pathAsString.replace(/\[([^\]]+)\]|([^.[\]]+)/g, (_, bracketProp, dotProp) => {
    parts.push(bracketProp !== undefined ? bracketProp : dotProp);
    return '';
  });
  return parts;
}

/**
 * @param {any} obj
 * @param {string} pathAsString
 * @return {unknown}
 */
function getInLhr(obj, pathAsString) {
  const parts = parseLhrPath(pathAsString);
  let cur = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

/**
 * @param {any} obj
 * @param {string} pathAsString
 * @param {string} value
 */
function setInLhr(obj, pathAsString, value) {
  const parts = parseLhrPath(pathAsString);
  if (!parts.length) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (cur === null || cur === undefined || typeof cur !== 'object') return;
    cur = cur[part];
  }
  if (cur !== null && cur !== undefined && typeof cur === 'object') {
    cur[parts[parts.length - 1]] = value;
  }
}

/**
 * @param {Array<any>} icuElements
 * @param {Map<string, any>} [customElements]
 * @return {Map<string, any>}
 */
function collectAllCustomElementsFromICU(icuElements, customElements = new Map()) {
  for (const el of icuElements) {
    if (el.type === ICU_TYPE.literal || el.type === ICU_TYPE.pound) continue;
    customElements.set(el.value, el);
    if (el.type === ICU_TYPE.plural && el.options) {
      for (const option of Object.values(el.options)) {
        collectAllCustomElementsFromICU(option.value, customElements);
      }
    }
  }
  return customElements;
}

/**
 * @param {string} message
 * @param {Record<string, string | number> | undefined} values
 * @param {string} locale
 * @return {string}
 */
function formatIcuMessage(message, values, locale) {
  const escapedMessage = message
    .replace(/'/g, `''`)
    .replace(/\\{/g, `'{`)
    .replace(/\\}/g, `'}`);
  const localeForMessageFormat = locale === 'en-XA' || locale === 'en-XL' ? 'de-DE' : locale;
  /** @type {typeof IntlMessageFormat} */
  // @ts-expect-error - handle both CJS and ESM default export shapes
  const IntlMessageFormatCtor = IntlMessageFormat.IntlMessageFormat || IntlMessageFormat;
  const formatter = new IntlMessageFormatCtor(
    escapedMessage,
    localeForMessageFormat,
    ICU_FORMATS,
    {ignoreTag: true}
  );

  const customElements = collectAllCustomElementsFromICU(formatter.getAst());
  /** @type {Record<string, string | number>} */
  const formattedValues = {};
  const rawValues = values || {};

  for (const [id, element] of customElements) {
    if (!(id in rawValues)) {
      throw new Error(`Missing ICU value "${id}"`);
    }
    const value = rawValues[id];
    if (element.type !== ICU_TYPE.number) {
      formattedValues[id] = value;
      continue;
    }
    if (typeof value !== 'number') {
      throw new Error(`Expected numeric ICU value for "${id}"`);
    }
    if (element.style === 'milliseconds') {
      formattedValues[id] = Math.round(value / 10) * 10;
    } else if (element.style === 'seconds' && id === 'timeInMs') {
      formattedValues[id] = Math.round(value / 100) / 10;
    } else if (element.style === 'bytes') {
      formattedValues[id] = value / 1024;
    } else {
      formattedValues[id] = value;
    }
  }

  const formattedResult = formatter.format(formattedValues);
  return typeof formattedResult === 'string' ? formattedResult : String(formattedResult);
}

/**
 * @param {LH.Result} lhr
 * @param {string} requestedLocale
 * @param {LhlMessages} localeMessages
 * @return {LH.Result}
 */
export function swapLocaleWithMessages(lhr, requestedLocale, localeMessages) {
  /** @type {LH.Result} */
  const clonedLhr = JSON.parse(JSON.stringify(lhr));
  if (!clonedLhr.i18n || !clonedLhr.i18n.icuMessagePaths) return clonedLhr;

  for (const [rawI18nId, icuMessagePath] of Object.entries(clonedLhr.i18n.icuMessagePaths)) {
    const normalizedI18nId = rawI18nId.replace(/^lighthouse-core\//, 'core/');
    const localeEntry = localeMessages[normalizedI18nId] || localeMessages[rawI18nId];
    if (!localeEntry) continue;

    for (const instance of icuMessagePath) {
      const path = typeof instance === 'string' ? instance : instance.path;
      const values = typeof instance === 'string' ? undefined : instance.values;
      const originalString = getInLhr(clonedLhr, path);
      if (typeof originalString !== 'string') continue;

      try {
        const relocalizedString = formatIcuMessage(localeEntry.message, values, requestedLocale);
        setInLhr(clonedLhr, path, relocalizedString);
      } catch (_) {
        // Keep original string if template placeholders drifted across Lighthouse versions.
      }
    }
  }

  /** @type {Record<string, string>} */
  const rendererFormattedStrings = {};
  for (const [icuMessageId, entry] of Object.entries(localeMessages)) {
    if (!icuMessageId.startsWith('report/renderer/report-utils.js | ')) continue;
    const key = icuMessageId.split(' | ')[1];
    if (key) rendererFormattedStrings[key] = entry.message;
  }
  if (Object.keys(rendererFormattedStrings).length) {
    clonedLhr.i18n.rendererFormattedStrings = rendererFormattedStrings;
  }

  clonedLhr.configSettings = clonedLhr.configSettings || /** @type {any} */ ({});
  clonedLhr.configSettings.locale = requestedLocale;
  return clonedLhr;
}

/**
 * @param {LH.Result | undefined} lhr
 * @return {boolean}
 */
export function hasIcuMessagePaths(lhr) {
  return Boolean(
    lhr &&
      lhr.i18n &&
      lhr.i18n.icuMessagePaths &&
      Object.keys(lhr.i18n.icuMessagePaths).length > 0
  );
}

/**
 * @param {LH.Result | undefined} lhr
 * @param {LH.Result | undefined} baseLhr
 */
export function useLocalizedLhrs(lhr, baseLhr) {
  const defaultLocale =
    (lhr && lhr.configSettings && lhr.configSettings.locale) ||
    (baseLhr && baseLhr.configSettings && baseLhr.configSettings.locale) ||
    'en-US';
  const [selectedLocale, setSelectedLocale] = useState(/** @type {string | null} */ (null));
  const [loadedLocaleState, setLoadedLocaleState] = useState(
    /** @type {{locale: string, messages: LhlMessages} | null} */ (null)
  );

  const activeLocale = selectedLocale || defaultLocale;
  const canSwapLocale = hasIcuMessagePaths(lhr) || hasIcuMessagePaths(baseLhr);

  useEffect(() => {
    if (!canSwapLocale) return;
    const lhrLocale = (lhr && lhr.configSettings && lhr.configSettings.locale) || 'en-US';
    const baseLocale = (baseLhr && baseLhr.configSettings && baseLhr.configSettings.locale) || lhrLocale;
    if (activeLocale === lhrLocale && activeLocale === baseLocale) {
      setLoadedLocaleState(null);
      return;
    }

    let isCancelled = false;
    loadLocaleData(activeLocale)
      .then(messages => {
        if (!isCancelled) {
          setLoadedLocaleState({locale: activeLocale, messages});
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [activeLocale, canSwapLocale, lhr, baseLhr]);

  const localizedLhr = useMemo(() => {
    if (!lhr || !loadedLocaleState || loadedLocaleState.locale !== activeLocale) return lhr;
    if (lhr.configSettings && lhr.configSettings.locale === activeLocale) return lhr;
    return swapLocaleWithMessages(lhr, activeLocale, loadedLocaleState.messages);
  }, [lhr, activeLocale, loadedLocaleState]);

  const localizedBaseLhr = useMemo(() => {
    if (!baseLhr || !loadedLocaleState || loadedLocaleState.locale !== activeLocale) return baseLhr;
    if (baseLhr.configSettings && baseLhr.configSettings.locale === activeLocale) return baseLhr;
    return swapLocaleWithMessages(baseLhr, activeLocale, loadedLocaleState.messages);
  }, [baseLhr, activeLocale, loadedLocaleState]);

  const availableLocales = useMemo(() => {
    const set = new Set([defaultLocale, ...CANONICAL_LOCALES]);
    return [...set].sort();
  }, [defaultLocale]);

  return {
    lhr: localizedLhr,
    baseLhr: localizedBaseLhr,
    locale: activeLocale,
    setLocale: setSelectedLocale,
    availableLocales,
    canSwapLocale,
  };
}

/**
 * @param {string} locale
 * @param {string} currentLocale
 * @return {string}
 */
export function formatLocaleOptionLabel(locale, currentLocale) {
  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
    try {
      const currentLocaleDisplay = new Intl.DisplayNames([currentLocale], {type: 'language'});
      const optionLocaleDisplay = new Intl.DisplayNames([locale], {type: 'language'});

      const optionLocaleName = optionLocaleDisplay.of(locale);
      const currentLocaleName = currentLocaleDisplay.of(locale) || locale;
      if (optionLocaleName && optionLocaleName !== currentLocaleName) {
        return `${optionLocaleName} – ${currentLocaleName}`;
      }
      return currentLocaleName;
    } catch (_) {
      return locale;
    }
  }

  return locale;
}

/** @param {{locale: string, setLocale: (locale: string) => void, availableLocales: string[]}} props */
export const LocaleDropdown = props => {
  const options = useMemo(
    () =>
      props.availableLocales.map(locale => ({
        value: locale,
        label: formatLocaleOptionLabel(locale, props.locale),
      })),
    [props.availableLocales, props.locale]
  );

  return (
    <div className="lhr-locale-selector" title="Report Locale">
      <i className="material-icons lhr-locale-selector__icon">language</i>
      <Dropdown
        className="dropdown--locale"
        value={props.locale}
        setValue={props.setLocale}
        options={options}
      />
    </div>
  );
};
