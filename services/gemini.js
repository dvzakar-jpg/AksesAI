/**
 * AksesAI - Gemini API Client Delegate
 * Routes AI operations via ApiService proxy to ensure secret keys are never exposed in browser.
 */

import { ApiService } from './apiService.js';

export const GeminiService = {
    /**
     * Simplify complex text, images, or documents into structured accessible format
     */
    async simplifyText(payload, scenario = 'Umum') {
        try {
            const options = typeof payload === 'string' ? { text: payload, scenario } : payload;
            return await ApiService.simplifyText(options);
        } catch (error) {
            console.error('GeminiService simplifyText error:', error);
            throw error;
        }
    },

    /**
     * Follow-up clarification / "Jelaskan Lebih Lanjut"
     */
    async explainFurther(originalText, currentSimplification, question) {
        try {
            return await ApiService.explainFurther(originalText, currentSimplification, question);
        } catch (error) {
            console.error('GeminiService explainFurther error:', error);
            throw error;
        }
    },

    /**
     * Process Audio/Video media file
     */
    async processAudioVideo(base64Data, mimeType, transcriptText = '') {
        try {
            return await ApiService.processAudioVideo(base64Data, mimeType, transcriptText);
        } catch (error) {
            console.error('GeminiService processAudioVideo error:', error);
            throw error;
        }
    }
};
