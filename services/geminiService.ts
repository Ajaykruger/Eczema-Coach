
import { GoogleGenAI, FunctionDeclaration, Type, Modality } from "@google/genai";
import { DailyLog, UserProfile, QuestionnaireData } from "../types";
import { INGREDIENTS_DB } from "./ingredients";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Audio Utils ---
// Helper to decode base64 to byte array
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to parse base64 mime type and data
function parseBase64Image(base64: string) {
  // Check if string has data URI scheme
  const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Fallback if raw base64 is provided (assume JPEG as safe default or from canvas)
  return { 
    mimeType: 'image/jpeg', 
    data: base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "") 
  };
}

// --- Text To Speech (New) ---
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  if (!API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Convert base64 to ArrayBuffer (raw PCM)
    const bytes = decodeBase64(base64Audio);
    return bytes.buffer;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};


// --- Text Chat (Existing) ---

// Define Tools
const addSupplementTool: FunctionDeclaration = {
  name: "add_supplement_to_order",
  description: "Add a specific supplement from the database to the user's custom blend/order.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      supplement_name: { 
        type: Type.STRING, 
        description: "The exact name of the supplement to add (e.g., 'Magnesium Glycinate')." 
      },
      reason: {
        type: Type.STRING, 
        description: "A brief explanation of why this is being added."
      }
    },
    required: ["supplement_name"]
  }
};

export const generateCoachResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  latestMessage: string,
  userProfile: UserProfile,
  recentLogs: DailyLog[]
): Promise<{ text: string, toolCalls: any[] }> => {
  if (!API_KEY) {
    return { text: "I'm sorry, I cannot connect to the brain right now (Missing API Key). However, remember that hydration is key today!", toolCalls: [] };
  }

  // Generate Ingredients Context
  const ingredientsContext = INGREDIENTS_DB.map(i => 
    `- ${i.name} (${i.category}): R${i.price}`
  ).join('\n');

  // Summarize context for the model
  const contextString = `
    User Profile:
    Name: ${userProfile.name}
    Skin Type: ${userProfile.skinType}
    Current Supplement Blend: ${JSON.stringify(userProfile.currentFormula)}
    
    Recent Logs (Last 3):
    ${recentLogs.slice(-3).map(l => `Date: ${l.date}, Itch: ${l.itchScore}/10, Stress: ${l.stressScore}/10, Sleep: ${l.sleepHours}hrs`).join('\n')}
    
    AVAILABLE SUPPLEMENTS DATABASE (Use ONLY these names if recommending products):
    ${ingredientsContext}
  `;

  const systemInstruction = `
    You are "EczemaCoach," a compassionate psychodermatology mentor AND a proactive Wellness Concierge for Tailorblend.
    
    Your Dual Role:
    1. THE MENTOR: Link the "Skin-Brain Axis" (stress = itch). Be empathetic and scientific.
    2. THE SALES CONCIERGE: You are an expert on the supplement catalog. Your job is to actively curate the user's formula.
    
    Sales & Recommendation Rules:
    - BENEFIT FIRST: When suggesting a product, pitch the benefit enthusiastically. 
      (Bad: "You could try Iron." -> Good: "For that fatigue, Iron A.A.C. is a game changer for oxygenating your cells.")
    - THE CLOSE: Don't just list products. explicitly ask to add them.
      (Example: "Shall I add that to your next blend for you?" or "I can pop that into your order right now, would you like that?")
    - DISCOVERY: After addressing the main issue, ask a follow-up diagnostic question to find other needs.
      (Example: "Since we're tackling your energy levels, how is your sleep quality lately? We have a great Magnesium for deep rest.")
    - TOOL USAGE: If the user says "Yes", "Sure", or asks for a product, USE the 'add_supplement_to_order' tool immediately.

    General Rules:
    - Keep responses concise (under 3 sentences where possible).
    - Use South African spelling (e.g., 'moisturise').
    - If the user complains of a symptom (tiredness, itch, dull skin), ALWAYS check the AVAILABLE SUPPLEMENTS DATABASE for a match and pitch it.
    
    Context Data:
    ${contextString}
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: [addSupplementTool] }]
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: latestMessage });
    
    const responseText = result.response.text || "";
    
    // Check for tool calls
    const toolCalls = result.response.functionCalls() || [];

    return { text: responseText, toolCalls };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having trouble connecting to the server. Let's take a deep breath and try again in a moment.", toolCalls: [] };
  }
};

// --- Onboarding Image Analysis (Existing) ---
export const analyzeSkinCondition = async (base64Image: string): Promise<Partial<QuestionnaireData>> => {
  if (!API_KEY) {
    console.warn("Missing API Key for Image Analysis");
    return {};
  }

  const prompt = `
    Analyze this image of a skin condition. 
    Act as a clinical dermatologist assistant. 
    
    I need you to classify the visual appearance based on these specific categories:
    - 'Dry': Flaking, scaling, roughness.
    - 'Red': Erythema, inflammation, pink/red discoloration.
    - 'Weeping': Oozing, wetness, serous exudate.
    - 'Crusting': Scabs, dried yellow/honey-colored fluid.
    - 'Lichenified': Thickened, leathery skin, emphasized skin markings.

    Also identify the body location if possible (e.g., Face, Hands, Arms, Legs, Neck, Torso).

    Return ONLY a valid JSON object with no markdown formatting. Structure:
    {
      "visualAppearance": ["string", "string"], 
      "eczemaLocations": ["string"]
    }
  `;

  try {
    const { mimeType, data } = parseBase64Image(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            { text: prompt }
          ]
        }
      ]
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return {};
  }
};

// --- Daily Check-In Comprehensive Analysis (Updated) ---
export interface DailyAnalysisResult {
  score: number;
  status: string;
  locations: string[];
  symptoms: string[];
  notes: string;
  explanation: string; // New field for plain English translation
}

export const analyzeDailyInflammation = async (base64Images: string[]): Promise<DailyAnalysisResult> => {
  if (!API_KEY) {
    console.warn("Missing API Key for Daily Analysis");
    return { score: 0, status: 'API Error', locations: [], symptoms: [], notes: '', explanation: '' };
  }

  if (base64Images.length === 0) {
    return { score: 0, status: 'No Image', locations: [], symptoms: [], notes: '', explanation: '' };
  }

  const prompt = `
    Act as a dermatologist performing a daily check-in assessment.
    Analyze the provided skin image(s) for Erythema (Redness), Inflammation, and Morphology.
    
    1. Grade overall severity (0-100) across all images provided:
       - 0-20: Calm/Post-Inflammatory
       - 21-50: Mild Redness
       - 51-75: Moderate Inflammation
       - 76-100: Severe/Angry
    
    2. Identify Body Locations visible (e.g., Face, Neck, Hands, Inner Elbow, Knees, Torso).
    
    3. Identify Specific Symptoms (Tags) present in any image:
       - Dry/Scaling
       - Weeping/Oozing
       - Crusting
       - Swelling/Edema
       - Lichenification (Thickening)
       - Excoriation (Scratch Marks)

    4. Write a brief (1 sentence) CLINICAL observation note using medical terminology (e.g., "Diffused erythema with scattered excoriations...").

    5. Write a brief (1 sentence) PLAIN ENGLISH explanation of that note for the patient (e.g., "The area is quite red with some small scratch marks...").

    If images are invalid/not skin, return score 0 and status "Invalid".

    Return ONLY a valid JSON object. Structure:
    {
      "score": number,
      "status": "string",
      "locations": ["string"],
      "symptoms": ["string"],
      "notes": "string",
      "explanation": "string"
    }
  `;

  try {
    // Construct parts array with all images, correctly handling mime types
    const imageParts = base64Images.map(img => {
      const { mimeType, data } = parseBase64Image(img);
      return {
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: prompt }
          ]
        }
      ]
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini Vision Error (Daily):", error);
    return { score: 0, status: 'Error', locations: [], symptoms: [], notes: '', explanation: '' };
  }
};
