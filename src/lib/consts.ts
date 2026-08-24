// Registered in the global symbol registry so two copies of sv-forms in one dependency tree still
// resolve to the same context key, instead of silently failing to find each other's provider.
export const FORM_CONTEXT_KEY = Symbol.for('sv-forms.FORM_CONTEXT_KEY')
