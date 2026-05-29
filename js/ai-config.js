const localConfig = window.SCENTMATE_AI_CONFIG || {};

export const aiConfig = {
    baseURL: String(localConfig.baseURL || '').trim(),
    apiKey: String(localConfig.apiKey || '').trim(),
    model: String(localConfig.model || 'gpt-4o-mini').trim()
};

export const isAIConfigured = !!aiConfig.baseURL && !!aiConfig.apiKey && !!aiConfig.model;
