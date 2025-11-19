import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { UploadedFile } from "../types";

let chatSession: Chat | null = null;
let currentModel: GenerativeModel | null = null;
let fileContextInitialized = false;

const SYSTEM_INSTRUCTION = `You are the "ISO 42001 Assistant", a specialized RAG (Retrieval-Augmented Generation) AI expert on the ISO/IEC 42001:2023 Artificial Intelligence Management System (AIMS) standard.

Your primary goal is to answer user questions accurately based *strictly* on the provided context documents (PDFs/files the user uploads). 
If the answer is not found in the provided context, strictly state that you cannot find the answer in the uploaded documents, but offer general knowledge if helpful (while clarifying it's general knowledge).

Tone: Professional, precise, and helpful. Use markdown for formatting (bullet points, bold text for key terms).

When referencing the standard:
- Cite specific clauses (e.g., "Clause 5.1") if available in the context.
- Explain complex requirements in simple terms.
`;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai;
};

/**
 * Resets the chat session. Should be called when new files are added.
 */
export const resetChatSession = () => {
  chatSession = null;
  fileContextInitialized = false;
};

export const sendMessageStream = async function* (
  message: string,
  files: UploadedFile[]
) {
  const ai = initializeGemini();
  if (!ai) {
    throw new Error("API Key not configured");
  }

  // Initialize chat session if it doesn't exist or if we need to inject context
  if (!chatSession) {
    // We use gemini-2.5-flash for its large context window and speed
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, // Lower temperature for more factual responses
      },
    });
  }

  // If files exist and we haven't sent them yet, we need to prime the chat with context.
  // Strategy: Send the files in the first user turn alongside the user's first question
  // OR as a separate hidden turn if this is a fresh session.
  
  if (files.length > 0 && !fileContextInitialized) {
    // This is the first message in a session with files.
    // We construct a message that includes the file parts.
    const parts: any[] = [];
    
    files.forEach(file => {
      // file.data is base64 encoded. contentPart expects raw base64 (no data: prefix)
      const cleanBase64 = file.data.split(',')[1]; 
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: cleanBase64
        }
      });
    });

    parts.push({ text: `Here are the reference documents for our discussion. Please analyze them. My first question is: ${message}` });
    
    fileContextInitialized = true;
    
    const result = await chatSession.sendMessageStream({
       message: parts // Passing array of parts as message
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }

  } else {
    // Normal text-only turn (context is already in history)
    const result = await chatSession.sendMessageStream({
      message: message,
    });

    for await (const chunk of result) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
  }
};