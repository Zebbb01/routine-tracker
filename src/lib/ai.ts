const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN || '';
const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';

export interface AIAnalysisResult {
  foodName: string;
  protein: number;
  calories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  followUp: string;
}

export async function analyzeMealWithAI(userInput: string): Promise<AIAnalysisResult | null> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Standard fast model on GitHub Models
        messages: [
          {
            role: 'system',
            content: `You are a fitness nutritionist assistant. The user will describe what they ate in natural language. 
Estimate the total protein (in grams) and total calories (in kcal) for the foods. Identify the meal type (breakfast, lunch, dinner, or snack). 
Additionally, write a brief, friendly follow-up question (under 20 words, no emojis) asking if they ate snacks or drinks (e.g. "Did you have any snacks or milk after that?").

You must return ONLY a valid JSON object matching this TypeScript interface, with no markdown formatting, backticks, or explanation:
interface AIAnalysisResult {
  foodName: string;
  protein: number; // estimated protein in grams (number)
  calories: number; // estimated calories in kcal (number)
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  followUp: string; // friendly question
}`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error Response:', errorText);
      throw new Error(`AI Request failed with status ${response.status}`);
    }

    const json = await response.json();
    const textContent = json.choices[0].message.content.trim();
    
    // Clean JSON content if the model wrapped it in markdown code blocks
    const cleanJSON = textContent.replace(/^```json\s*|```\s*$/g, '');
    const result: AIAnalysisResult = JSON.parse(cleanJSON);

    // Validate fields
    if (!result.foodName || typeof result.protein !== 'number' || typeof result.calories !== 'number') {
      throw new Error('AI returned invalid payload structure');
    }

    return result;
  } catch (error) {
    console.error('Error in analyzeMealWithAI:', error);
    return null;
  }
}
