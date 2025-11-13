import { GoogleGenAI } from "@google/genai";
import { Trade } from '../types';

// Helper to convert a data URI to a Google Generative AI Part object.
const dataURIToPart = (dataURI: string) => {
    const match = dataURI.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        console.warn(`Invalid data URI format, skipping image.`);
        return null;
    }
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};


export const analyzeTradesWithAI = async (prompt: string, trades: Trade[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
You are a world-class trading performance analyst. Your role is to analyze a trader's performance based on their trade history and provide actionable, insightful, and clear feedback.

The user will provide their trade history in JSON format, a question, and potentially images for some trades. Your analysis should be professional, data-driven, and encouraging.

Here are the fields in the trade data:
- 'id': A unique identifier for the trade.
- 'date': The date of the trade.
- 'type': 'BUY' or 'SELL'.
- 'outcome': 'TP' (Take Profit), 'SL' (Stop Loss), 'BE' (Break Even), or 'NO_TRADE' (a day where no trade was taken).
- 'slSize': The size of the stop loss in pips or points.
- 'tpSize': The size of the take profit in pips or points.
- 'activationTime': The time the trade was activated (e.g., "10:30").
- 'slSweepNotes': Specific notes about the candle that hit the stop loss before a potential move to TP.
- 'notes': General trader's notes, which might include details about the entry candle or general market conditions.
- 'image_references': A reference indicating that images are provided for this trade. The images will follow the JSON data, and may be labeled as 'Before', 'After', or 'MetaTrader Screen'.

When answering, break down your analysis into clear sections. Look for patterns in:
- Win/loss streaks.
- Performance on different days or at different times (using 'activationTime').
- Common reasons for losses based on 'notes' and 'slSweepNotes'.
- The relationship between TP/SL sizes and outcomes.
- Visual patterns from the trade images, such as entry points, market structure, and candlestick formations. Refer to images by their labels when available.
- Any recurring themes in the 'slSweepNotes' that could indicate a recurring setup issue.

Answer the user's specific question, but also feel free to provide additional unsolicited advice if you spot a clear pattern they might be missing. When discussing a specific trade that has images, refer to it by its ID and date to provide context.
  `;

  // Prepare multimodal content parts
  const contentParts = [];

  // Create a version of trades for the JSON prompt, replacing image data with a reference.
  const tradesForAI = trades.map(trade => {
    const { images, ...tradeData } = trade;
    let image_references = 'No images provided for this trade.';
    if (images && typeof images === 'object' && Object.keys(images).length > 0) {
        const labels = Object.keys(images).join(', ');
        image_references = `See accompanying images for trade ID ${trade.id} (${labels})`;
    }
    return {
      ...tradeData,
      image_references,
    };
  });
  
  const textPromptPart = `Here is the trader's history:\n${JSON.stringify(tradesForAI, null, 2)}\n\nBased on this data and any accompanying images, please answer the following question: "${prompt}"`;
  contentParts.push({ text: textPromptPart });
  
  // Add images to the content parts
  trades.forEach(trade => {
    if (trade.images && typeof trade.images === 'object' && Object.keys(trade.images).length > 0) {
        contentParts.push({ text: `Images for trade ID ${trade.id} on ${trade.date}:` });
        Object.entries(trade.images).forEach(([key, imgData]) => {
            if(imgData) {
                const imagePart = dataURIToPart(imgData);
                if (imagePart) {
                    const label = key === 'metatrader' ? 'MetaTrader Screen' : key.charAt(0).toUpperCase() + key.slice(1);
                    contentParts.push({ text: `--- ${label} ---` });
                    contentParts.push(imagePart);
                }
            }
        });
    }
  });


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: contentParts },
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error while analyzing your trades. Please check the console for details.";
  }
};

export const analyzeSlSweepsWithAI = async (trades: Trade[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
You are an expert trading analyst specializing in price action and liquidity analysis. Your task is to analyze a collection of notes written by a trader describing the specific candles that triggered their stop losses.

The user will provide a list of these notes. Your goal is to identify and synthesize recurring patterns, themes, or keywords from these notes.

Look for patterns related to:
- **Candle Types:** Doji, engulfing candles, pin bars, wicks, etc.
- **Timing:** News events, session opens (New York, London), specific times of day.
- **Market Structure:** Break of structure (BOS), sweeps of previous highs/lows, tests of order blocks or fair value gaps (FVG).
- **Keywords:** "Sweep," "grab," "spike," "news," "manipulation," "high volume," etc.

Structure your analysis into a clear, concise report. Use bullet points to highlight the key recurring patterns you've identified. Conclude with a summary of the most significant pattern and suggest what the trader should watch out for to avoid similar stop-outs in the future. Your tone should be that of a helpful mentor.
  `;

  const slSweepNotes = trades
    .filter(trade => trade.slSweepNotes && trade.slSweepNotes.trim() !== '')
    .map(trade => `- ${trade.slSweepNotes}`);

  if (slSweepNotes.length < 3) {
      return "There aren't enough 'SL Sweep Notes' to perform a meaningful analysis. Please add more detailed notes to your losing trades to use this feature.";
  }

  const fullPrompt = `Here are the trader's notes on the candles that triggered their stop losses:\n\n${slSweepNotes.join('\n')}\n\nPlease analyze these for recurring patterns.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for SL sweep analysis:", error);
    return "Sorry, I encountered an error while analyzing your SL sweep notes. Please check the console for details.";
  }
};
