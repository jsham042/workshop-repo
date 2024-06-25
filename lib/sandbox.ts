'use server'

import { CodeInterpreter } from '@e2b/code-interpreter'
import { Code } from 'lucide-react'

export const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

// Creates a new or connects to an existing code interpreter sandbox
export async function createOrConnect(userID: string) {
  const allSandbox = await CodeInterpreter.list()
  const sandBoxInfo= allSandbox.find(sbx=> sbx.metadata?.userID === userID)
  if (!sandBoxInfo) {
    return await CodeInterpreter.create({
      metadata: {
        userID,
      },
    })
  }
  return CodeInterpreter.reconnect(sandBoxInfo.sandboxID)
}

// Runs AI-generated Python code in the code interpreter sandbox
export async function runPython(userID: string, code: string) {
  const sbx = await createOrConnect(userID)
  console.log('Running Code')
  const result = await sbx.notebook.execCell(code)
  console.log('Result', result)
  return result
}