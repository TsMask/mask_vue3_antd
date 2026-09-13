export const CRON_FIELD_KEYS = [
  'second',
  'minute',
  'hour',
  'day',
  'month',
  'week',
] as const;

export type CronFieldKey = (typeof CRON_FIELD_KEYS)[number];
export type CronParts = Record<CronFieldKey, string>;

export const DEFAULT_CRON = '* * * * * ?';

type CronFieldConfig = {
  title: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  linked: boolean;
};

export const cronFieldConfigs = {
  second: { title: '秒', unit: '秒', min: 0, max: 59, step: 1, linked: false },
  minute: {
    title: '分钟',
    unit: '分钟',
    min: 0,
    max: 59,
    step: 1,
    linked: false,
  },
  hour: { title: '小时', unit: '小时', min: 0, max: 23, step: 1, linked: false },
  day: { title: '日', unit: '日', min: 1, max: 31, step: 1, linked: true },
  month: { title: '月', unit: '月', min: 1, max: 12, step: 1, linked: false },
  week: { title: '周', unit: '周', min: 0, max: 6, step: 1, linked: true },
} satisfies Record<CronFieldKey, CronFieldConfig>;

const weekNames: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const monthNames: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export type CronFieldMode =
  | 'every'
  | 'interval'
  | 'range'
  | 'specific'
  | 'unspecified';

export type CronFieldState = {
  mode: CronFieldMode;
  intervalStart: number;
  interval: number;
  rangeStart: number;
  rangeEnd: number;
  specific: string[];
};

function createFieldState(field: CronFieldKey, value = '*'): CronFieldState {
  const config = cronFieldConfigs[field];
  return {
    mode: config.linked && value === '?' ? 'unspecified' : 'every',
    intervalStart: config.min,
    interval: config.step,
    rangeStart: config.min,
    rangeEnd: Math.min(config.min + 1, config.max),
    specific: [String(config.min)],
  };
}

function parseNumber(value: string, config: CronFieldConfig) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= config.min && parsed <= config.max
    ? parsed
    : null;
}

function normalizeFieldValue(value: string, config: CronFieldConfig) {
  const upperValue = value.toUpperCase();
  if (config === cronFieldConfigs.week && upperValue in weekNames) {
    return String(weekNames[upperValue]);
  }
  if (config === cronFieldConfigs.month && upperValue in monthNames) {
    return String(monthNames[upperValue]);
  }
  return value;
}

function parseSpecificPart(
  part: string,
  config: CronFieldConfig
): number[] | null {
  const [rawRange, rawStep] = part.split('/');
  if (rawRange === '*' || rawRange === '?') {
    const values = Array.from(
      { length: config.max - config.min + 1 },
      (_, index) => config.min + index
    );
    if (rawStep === undefined) return values;

    const step = parseNumber(rawStep, config);
    if (step === null || step < 1) return null;
    return values.filter((_, index) => index % step === 0);
  }
  if (rawStep !== undefined) {
    const step = parseNumber(rawStep, config);
    if (step === null || step < 1) return null;
    const steppedValues = parseSpecificPart(rawRange, config);
    return steppedValues
      ? steppedValues.filter((_, index) => index % step === 0)
      : null;
  }

  const rangeMatch = part.match(/^(\w+)-(\w+)$/);
  if (rangeMatch) {
    const start = parseNumber(
      normalizeFieldValue(rangeMatch[1], config),
      config
    );
    const end = parseNumber(normalizeFieldValue(rangeMatch[2], config), config);
    if (start === null || end === null || start > end) return null;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  const parsed = parseNumber(normalizeFieldValue(part, config), config);
  return parsed === null ? null : [parsed];
}

export function parseCronField(
  field: CronFieldKey,
  rawValue: string
): CronFieldState | null {
  const config = cronFieldConfigs[field];
  const state = createFieldState(field, rawValue);
  const value = rawValue.trim();

  if (value === '*') return state;
  if (value === '?') {
    return config.linked ? { ...state, mode: 'unspecified' } : state;
  }
  if (value.includes('/')) {
    const [rawStart, rawStep] = value.split('/');
    const start =
      rawStart === '*' || rawStart === '?'
        ? config.min
        : parseNumber(normalizeFieldValue(rawStart, config), config);
    const step = parseNumber(rawStep, config);
    if (start !== null && step !== null && step >= 1) {
      return {
        ...state,
        mode: 'interval',
        intervalStart: start,
        interval: step,
      };
    }
  }

  if (value.includes('-') && !value.includes(',') && !value.includes('/')) {
    const [rawStart, rawEnd] = value.split('-');
    const start = parseNumber(normalizeFieldValue(rawStart, config), config);
    const end = parseNumber(normalizeFieldValue(rawEnd, config), config);
    if (start === null || end === null || start > end) return null;

    return { ...state, mode: 'range', rangeStart: start, rangeEnd: end };
  }

  const values = new Set<number>();
  for (const part of value.split(',')) {
    const parsedPart = parseSpecificPart(part, config);
    if (!parsedPart) return null;
    parsedPart.forEach(item => values.add(item));
  }
  if (!values.size) return null;

  return {
    ...state,
    mode: 'specific',
    specific: [...values].sort((a, b) => a - b).map(String),
  };
}

export function formatCronField(
  field: CronFieldKey,
  state: CronFieldState
): string {
  const config = cronFieldConfigs[field];

  switch (state.mode) {
    case 'every':
      return '*';
    case 'unspecified':
      return config.linked ? '?' : '*';
    case 'interval': {
      const start = Math.min(
        Math.max(state.intervalStart, config.min),
        config.max
      );
      const step = Math.min(Math.max(state.interval, 1), config.max);
      return `${start}/${step}`;
    }
    case 'range': {
      const start = Math.min(
        Math.max(state.rangeStart, config.min),
        config.max
      );
      const end = Math.min(Math.max(state.rangeEnd, config.min), config.max);
      return start <= end ? `${start}-${end}` : `${start}-${config.max}`;
    }
    case 'specific': {
      const values = state.specific
        .map(item => parseNumber(item, config))
        .filter((item): item is number => item !== null)
        .sort((a, b) => a - b);
      return values.length
        ? [...new Set(values)].join(',')
        : String(config.min);
    }
  }
}

export function parseCronExpression(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== CRON_FIELD_KEYS.length) return null;

  const parsedParts = {} as CronParts;
  for (const [index, field] of CRON_FIELD_KEYS.entries()) {
    const parsedState = parseCronField(field, parts[index]);
    if (!parsedState) return null;
    parsedParts[field] = formatCronField(field, parsedState);
  }

  return parsedParts;
}

export function buildCronExpression(parts: CronParts): string {
  return CRON_FIELD_KEYS.map(field => parts[field]).join(' ');
}

export function getCronFieldOptions(field: CronFieldKey) {
  const config = cronFieldConfigs[field];
  return Array.from({ length: config.max - config.min + 1 }, (_, index) => {
    const value = config.min + index;
    const label =
      field === 'week'
        ? weekLabels[value - 1]
        : field === 'month'
          ? `${value}月`
          : String(value);
    return { label, value: String(value) };
  });
}
