import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from "@google/generative-ai";
import { Font } from "@/types/index";
import {
  instruction,
  fontResultFormat,
  inputFont,
  inputColourPallete,
  typeInstruction,
  fontOutput,
  inputWording,
  colourPalleteOutput,
  wordingOutput,
  finalReviewInformation,
  finalReviewOutput,
} from "./prompts";

class ChatbotHelper {
  private static instance: ChatbotHelper;

  private constructor(private model: GenerativeModel) { }

  public static getInstance(): ChatbotHelper {
    if (!ChatbotHelper.instance) {
      ChatbotHelper.instance = new ChatbotHelper(
        new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        })
      );
    }
    return ChatbotHelper.instance;
  }

  public async assessWording(wording: string[]): Promise<GenerateContentResult> {
    const wordingInString = JSON.stringify(wording);
    const result = await this.model.generateContent({
      contents: [
        {
          parts: [
            { text: instruction },
            { text: wordingOutput }
          ],
          role: "model",
        },
        {
          parts: [{ text: inputWording(wordingInString) }],
          role: "user",
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    return result;
  }

  public async assessFont(font: Font): Promise<GenerateContentResult> {
    const fontInJSON = JSON.stringify(font);
    const result = await this.model.generateContent({
      contents: [
        {
          parts: [
            { text: instruction },
            { text: fontResultFormat },
            { text: typeInstruction },
            { text: fontOutput },
          ],
          role: "model",
        },
        {
          parts: [{ text: inputFont(fontInJSON) }],
          role: "user",
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    return result;
  }

  public async assessColourPallete(colorPallete: string[]): Promise<GenerateContentResult> {
    const colourPalleteInString = JSON.stringify(colorPallete);
    const result = await this.model.generateContent({
      contents: [
        {
          parts: [
            { text: instruction },
            { text: colourPalleteOutput }
          ],
          role: "model",
        },
        {
          parts: [{ text: inputColourPallete(colourPalleteInString) }],
          role: "user",
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    return result;
  }

  public async grading(font: Font, color: string[], wording: string[], tags: string[]): Promise<GenerateContentResult> {
    const fontInJSON = JSON.stringify(font);
    const colorInJSON = JSON.stringify(color);
    const wordingInJSON = JSON.stringify(wording);
    const result = await this.model.generateContent({
      contents: [
        {
          parts: [
            { text: instruction },
            { text: finalReviewInformation(tags) },
            { text: fontResultFormat },
            { text: finalReviewOutput },
          ],
          role: "model",
        },
        {
          parts: [
            { text: inputFont(fontInJSON) },
            { text: inputColourPallete(colorInJSON) },
            { text: inputWording(wordingInJSON) },
          ],
          role: "user",
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    return result;
  }
}

export const chatbotHelper = ChatbotHelper.getInstance();