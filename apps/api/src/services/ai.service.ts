import Groq from 'groq-sdk';
import { config } from '../config/env';
import { logger } from '../utils/logger';

class AIService {
  private groq: Groq | null = null;

  constructor() {
    if (config.groqApiKey) {
      this.groq = new Groq({
        apiKey: config.groqApiKey,
      });
    } else {
      logger.warn('AI Service: GROQ_API_KEY is not provided. AI features will be disabled.');
    }
  }

  async getChatCompletion(systemPrompt: string, userPrompt: string) {
    if (!this.groq) {
      throw new Error('AI Service: Groq is not initialized. Please provide GROQ_API_KEY.');
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('AI Service Error:', error);
      throw error;
    }
  }

  async generateFinancialInsights(data: any) {
    const systemPrompt = `
      You are an expert financial advisor for an ERP system called Flux-ERP. 
      Your goal is to provide concise, actionable, and professional insights based on the provided business data.
      Instructions:
      1. Provide exactly 3 bullet points.
      2. Each bullet point must be no more than 2 sentences.
      3. Use bold text for key metrics or terms.
      4. Focus on the most critical financial health indicators.
      5. Keep the total response length under 100 words.
    `;

    const userPrompt = `
      Here is the current business snapshot:
      - Total Revenue: $${data.totalRevenue}
      - Total Expenses: $${data.totalExpenses}
      - Net Profit: $${data.netProfit}
      - Pending Invoices: ${data.pendingInvoices}
      - Overdue Amount: $${data.overdueAmount}
      - Growth Trend: ${data.revenueTrend}%
      
      Recent Activities:
      ${data.recentActivities?.map((a: any) => `- ${a.details}`).join('\n')}

      Please provide 3-4 key insights or recommendations for the business owner.
    `;

    return this.getChatCompletion(systemPrompt, userPrompt);
  }
  async getChatWithContext(userPrompt: string, contextData: any) {
    const systemPrompt = `
      You are the Flux-ERP AI Assistant. You have access to the following business data:
      ${JSON.stringify(contextData)}

      Instructions:
      1. Answer questions accurately based on the data.
      2. If you don't have enough data, be honest but helpful.
      3. Use professional, concise language.
      4. Use markdown for tables or lists when helpful.
      5. The user is asking about their own business.
    `;

    return this.getChatCompletion(systemPrompt, userPrompt);
  }
}

export const aiService = new AIService();
