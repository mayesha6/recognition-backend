import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // make sure this is set in your .env
});
export const generateAIReply = async (userText: string) => {
  if (!userText) return "I need some text to respond!";

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: userText },
    ],
  });

  return response.choices[0].message?.content || "Sorry, I could not generate a reply.";
};