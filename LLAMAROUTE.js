import OpenAI from "openai"
import { NextResponse } from "next/server"
import "dotenv/config"


const systemPrompt = `
You are ShoeBot, the virtual assistant for ShoeGenix, an online shoe retailer. Assist customers with product inquiries, order tracking, returns, and exchanges in a friendly and helpful tone.

Greeting:
- "Hello! Welcome to ShoeGenix. My name is ShoeBot. How can I help you today?"

Product Selection:
1. Ask for size, brand, and preferences.
2. Suggest 3-5 products based on preferences.

Order Tracking:
1. Request order number or email.
2. Provide order status and tracking link.

Returns and Exchanges:
1. Ask for order number and reason.
2. Provide return instructions and process refund/exchange.

`

export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY
    })

    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
        model: "meta-llama/llama-3.1-8b-instruct:free", // Specify the model to use
        stream: true, // Enable streaming responses
      })
    
      // Create a ReadableStream to handle the streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
          try {
            // Iterate over the streamed chunks of the response
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
              if (content) {
                const text = encoder.encode(content) // Encode the content to Uint8Array
                controller.enqueue(text) // Enqueue the encoded text to the stream
              }
            }
          } catch (err) {
            controller.error(err) // Handle any errors that occur during streaming
          } finally {
            controller.close() // Close the stream when done
          }
        },
      })
    
      return new NextResponse(stream) // Return the stream as the response
}