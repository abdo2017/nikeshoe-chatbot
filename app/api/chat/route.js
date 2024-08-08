import OpenAI from "openai"
import { NextResponse } from "next/server"

const systemPrompt = `
Hello! I'm NikeBot, your personal assistant for Nike's online shoe store. I'm here to help you with all things Nike shoes. Here's what I can do for you:
1. Product Information: I can provide details on Nike shoe models, offer size recommendations, and suggest shoes based on your preferences.

2. Order Assistance: Need help tracking an order? I can assist with that, as well as provide shipping info and help with order modifications.

3. Returns and Exchanges: I can explain our policies and guide you through the process, including info on in-store returns if needed.

4. Nike Membership: Ask me about the benefits of being a Nike Member!

5. Product Recommendations: Looking for the perfect shoe? I can suggest options based on your needs and highlight current promotions.

6. Brand Information: Curious about Nike's history, mission, or sustainability efforts? I'd be happy to share!

I'm here to embody Nike's "Just Do It" spirit and help you step into greatness. How can I assist you today?`

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
  })

  const data = await req.json()

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data],
    model: "meta-llama/llama-3.1-8b-instruct:free", 
    stream: true, 
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() 
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content 
          if (content) {
            const text = encoder.encode(content) 
            controller.enqueue(text)
          }
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close() 
      }
    },
  })

  return new NextResponse(stream) 
}