import { z } from 'zod'
import {
  type CoreMessage,
  StreamingTextResponse,
  StreamData,
  streamText,
  tool,
} from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

import {
  runPython,
} from '@/lib/sandbox'

import { prompt } from '@/lib/prompt'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

export async function POST(req: Request) {
   const { messages, userID } = await req.json()

   const data = new StreamData()

   const result = await streamText({
     model: anthropic('claude-3-5-sonnet-20240620'),
     tools: {
      runPython: tool({
        description: 'Run a python script',
        parameters: z.object({
          code: z.string().describe('The code to run'),
          title: z.string().describe('Short title to describe the code'),
          description: z.string().describe('Long description of what the code does'),
        }),
        async execute({code}) {
          data.append({
            toolName: 'runPython',
            status: 'running',
          })
          const result = await runPython(userID ,code)
          const stdout = result.logs.stdout
          const stderr = result.logs.stderr
          const runtimeError = result.error
          const cellResults = result.results
          return {
            stdout,
            stderr,
            runtimeError,
            cellResults,
          }
        },
      })
     },
     messages,
     system: prompt,
   })

   const stream = result.toAIStream({
    async onFinal() {
      await data.close()
    },
   })
   
   return new StreamingTextResponse(stream, {}, data)
}

