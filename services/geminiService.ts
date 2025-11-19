import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { UploadedFile } from "../types";

let chatSession: Chat | null = null;
// Track which files (by ID) have already been sent to the model in the current session
const sentFileIds = new Set<string>();

const SYSTEM_INSTRUCTION = `You are the "ISO 42001 Assistant", an expert consultant on the ISO/IEC 42001:2023 Artificial Intelligence Management System (AIMS) standard.

CONTEXT & KNOWLEDGE SOURCE:
The user has access to a dedicated Google Drive folder containing the official documentation.
Your answers must be based **strictly** on the documents the user uploads from this repository (PDFs of the Standard, Risk Assessment Matrices, Internal Audit Checklists, etc.).

If the answer is not found in the currently uploaded context files:
1. State clearly that the information is not in the provided documents.
2. Offer general expert knowledge on ISO 42001, but clearly distinguish this as "General Knowledge" vs "Documented Fact".

Your capabilities:
- Explain clauses (4-10) and Annex A controls.
- Assist with AI Risk Assessment (Clause 6.1).
- Guide Internal Audits (Clause 9.2).
- Interpret definitions and requirements.

Tone: Professional, precise, audit-ready. Use markdown for clarity.
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
 * Resets the chat session. Call this when files are REMOVED or the user wants a fresh start.
 */
export const resetChatSession = () => {
  chatSession = null;
  sentFileIds.clear();
};

export const sendMessageStream = async function* (
  messageText: string,
  currentFiles: UploadedFile[]
) {
  const ai = initializeGemini();
  if (!ai) {
    throw new Error("API Key not configured");
  }

  // Initialize chat session if it doesn't exist
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for compliance accuracy
      },
    });
  }

  // Identify which files in the current list haven't been sent to the model yet
  const newFiles = currentFiles.filter(file => !sentFileIds.has(file.id));
  
  // Construct the message payload
  const parts: any[] = [];

  // Add new files to the payload
  if (newFiles.length > 0) {
    newFiles.forEach(file => {
      // file.data is "data:mime/type;base64,..."
      const cleanBase64 = file.data.split(',')[1]; 
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: cleanBase64
        }
      });
      // Mark as sent so we don't re-send them in future turns
      sentFileIds.add(file.id);
    });
  }

  // Add the user's text prompt
  // If we have new files, we prepend a small context note invisibly to the model logic
  if (newFiles.length > 0) {
    parts.push({ text: `[System: The user has attached ${newFiles.length} new document(s). Use them as context.]\n\n${messageText}` });
  } else {
    parts.push({ text: messageText });
  }

  // Send the message (Files + Text combined in one turn)
  const result = await chatSession.sendMessageStream({
    message: parts
  });

  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
};