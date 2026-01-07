
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "./types";

const getApiKey = () => {
  try {
    return typeof process !== 'undefined' ? process.env.API_KEY : '';
  } catch {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });

export async function getFinancialForecast(transactions: Transaction[]) {
  const summary = transactions.map(t => ({
    date: t.date,
    amount: t.type === 'INCOME' ? t.amount : -t.amount,
    category: t.category
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise este histórico financeiro e gere uma previsão para os próximos 3 meses em formato JSON: ${JSON.stringify(summary)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          forecast: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING, description: 'Mês da projeção (Ex: Outubro)' },
                revenue: { type: Type.NUMBER },
                expense: { type: Type.NUMBER },
                insight: { type: Type.STRING, description: 'Breve análise estratégica' }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function getKPIAnalysis(kpis: any) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Com base nestes KPIs financeiros de um ERP, dê uma análise estratégica curta e objetiva em 3 tópicos: ${JSON.stringify(kpis)}`,
  });

  return response.text || '';
}
