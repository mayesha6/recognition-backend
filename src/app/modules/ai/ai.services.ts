import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateMessage = async (payload: any) => {
  const { category, tone, value } = payload;

  const prompt = `
Write a short recognition message.

Category: ${category}
Tone: ${tone}
Value: ${value}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
};

export const RecognitionAIServices = {
  generateMessage,
};