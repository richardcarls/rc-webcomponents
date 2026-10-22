const numberFormats = new Map<string, Intl.NumberFormat>();
const collators = new Map<string, Intl.Collator>();

function cached<T, O>(
  cache: Map<string, T>,
  create: (locale: string | undefined, options: O) => T,
  locale: string | undefined,
  options: O,
): T {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let value = cache.get(key);

  if (!value) {
    value = create(locale, options);
    cache.set(key, value);
  }

  return value;
}

/** A shared `Intl.NumberFormat`. An unset or invalid locale uses the runtime default. */
export function numberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  return cached(
    numberFormats,
    (tag, opts: Intl.NumberFormatOptions) => {
      try {
        return new Intl.NumberFormat(tag, opts);
      } catch {
        return new Intl.NumberFormat(undefined, opts);
      }
    },
    locale,
    options,
  );
}

/** A shared `Intl.Collator`. An unset or invalid locale uses the runtime default. */
export function collator(
  locale: string | undefined,
  options: Intl.CollatorOptions = {},
): Intl.Collator {
  return cached(
    collators,
    (tag, opts: Intl.CollatorOptions) => {
      try {
        return new Intl.Collator(tag, opts);
      } catch {
        return new Intl.Collator(undefined, opts);
      }
    },
    locale,
    options,
  );
}
