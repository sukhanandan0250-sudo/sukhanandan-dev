
export interface ValidationRule {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  email?: boolean | string
  url?: boolean | string
  min?: number | { value: number; message: string }
  max?: number | { value: number; message: string }
  custom?: (value: any) => string | null
}

export interface FieldState {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
  valid: boolean
}

export type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FieldState
}

// ── Core validators ──────────────────────────────────────────

export const Validators = {
  required(value: any, message = 'This field is required'): string | null {
    if (value === null || value === undefined) return message
    if (typeof value === 'string' && value.trim() === '') return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  },

  email(value: string, message = 'Enter a valid email address'): string | null {
    if (!value) return null
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
    return re.test(value.trim()) ? null : message
  },

  minLength(value: string, min: number, message?: string): string | null {
    if (!value) return null
    return value.length >= min ? null : (message || `Must be at least ${min} characters`)
  },

  maxLength(value: string, max: number, message?: string): string | null {
    if (!value) return null
    return value.length <= max ? null : (message || `Must be no more than ${max} characters`)
  },

  // ✅ FIXED
  min(value: number | string, min: number, message?: string): string | null {
    if (value === null || value === undefined || value === '') return null

    const num = Number(value)

    if (Number.isNaN(num)) {
      return message || 'Invalid number'
    }

    return num >= min ? null : (message || `Must be at least ${min}`)
  },

  // ✅ FIXED
  max(value: number | string, max: number, message?: string): string | null {
    if (value === null || value === undefined || value === '') return null

    const num = Number(value)

    if (Number.isNaN(num)) {
      return message || 'Invalid number'
    }

    return num <= max ? null : (message || `Must be no more than ${max}`)
  },

  pattern(value: string, pattern: RegExp, message = 'Invalid format'): string | null {
    if (!value) return null
    return pattern.test(value) ? null : message
  },

  url(value: string, message = 'Enter a valid URL'): string | null {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return message
    }
  },

  hostname(value: string, message = 'Enter a valid hostname (e.g. smtp.gmail.com)'): string | null {
    if (!value) return null
    const re =
      /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
    return re.test(value.trim()) ? null : message
  },

  port(value: number | string, message = 'Port must be between 1 and 65535'): string | null {
    const n = Number(value)
    if (!value && value !== 0) return null
    return Number.isInteger(n) && n >= 1 && n <= 65535 ? null : message
  },

  noSpaces(value: string, message = 'Cannot contain spaces'): string | null {
    if (!value) return null
    return /\s/.test(value) ? message : null
  },

  passwordStrength(value: string): { score: number; label: string; color: string } {
    if (!value) return { score: 0, label: '', color: '' }

    let score = 0

    if (value.length >= 8) score++
    if (value.length >= 12) score++
    if (/[A-Z]/.test(value)) score++
    if (/[0-9]/.test(value)) score++
    if (/[^A-Za-z0-9]/.test(value)) score++

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Very Weak', color: '#ef4444' },
      { score: 2, label: 'Weak', color: '#f97316' },
      { score: 3, label: 'Fair', color: '#f59e0b' },
      { score: 4, label: 'Strong', color: '#10b981' },
      { score: 5, label: 'Very Strong', color: '#06b6d4' },
    ]

    return levels[Math.min(score, 5)]
  },

  fileType(file: File | null, allowed: string[], message?: string): string | null {
    if (!file) return null
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    return allowed.includes(ext) ? null : (message || `Allowed types: ${allowed.join(', ')}`)
  },

  fileSize(file: File | null, maxMB: number, message?: string): string | null {
    if (!file) return null
    const maxBytes = maxMB * 1024 * 1024
    return file.size <= maxBytes ? null : (message || `File must be smaller than ${maxMB}MB`)
  },

  futureDate(value: string, message = 'Date must be in the future'): string | null {
    if (!value) return null
    return new Date(value) > new Date() ? null : message
  },

  // Run multiple validators and return first error
  run(value: any, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
      if (rule.required) {
        const msg = typeof rule.required === 'string' ? rule.required : undefined
        const err = Validators.required(value, msg)
        if (err) return err
      }

      if (rule.email) {
        const msg = typeof rule.email === 'string' ? rule.email : undefined
        const err = Validators.email(value, msg)
        if (err) return err
      }

      if (rule.minLength !== undefined) {
        const { value: min, message: msg } =
          typeof rule.minLength === 'number'
            ? { value: rule.minLength, message: undefined }
            : rule.minLength

        const err = Validators.minLength(value, min, msg)
        if (err) return err
      }

      if (rule.maxLength !== undefined) {
        const { value: max, message: msg } =
          typeof rule.maxLength === 'number'
            ? { value: rule.maxLength, message: undefined }
            : rule.maxLength

        const err = Validators.maxLength(value, max, msg)
        if (err) return err
      }

      if (rule.min !== undefined) {
        const { value: min, message: msg } =
          typeof rule.min === 'number'
            ? { value: rule.min, message: undefined }
            : rule.min

        const err = Validators.min(value, min, msg)
        if (err) return err
      }

      if (rule.max !== undefined) {
        const { value: max, message: msg } =
          typeof rule.max === 'number'
            ? { value: rule.max, message: undefined }
            : rule.max

        const err = Validators.max(value, max, msg)
        if (err) return err
      }

      if (rule.pattern) {
        const { value: pat, message: msg } =
          rule.pattern instanceof RegExp
            ? { value: rule.pattern, message: undefined }
            : rule.pattern

        const err = Validators.pattern(value, pat, msg)
        if (err) return err
      }

      if (rule.custom) {
        const err = rule.custom(value)
        if (err) return err
      }
    }

    return null
  },
}