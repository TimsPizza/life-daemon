import OpenAI from "openai";
import { env } from "../utils/envConfig";
import pino from "pino";

const logger = pino({
  name: "OpenAIClient",
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

// instantiate global OpenAI client
const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_API_URL,
});

// const getOpenaiRequestBody = (model: string, prompt: string) => {
//   return {
//     model: model,
//     messages: [
//       {
//         role: "user",
//         content: prompt,
//       },
//     ],
//   };
// };

export const sendOpenAIRequest = async (prompt: string) => {
  // const requestBody = getOpenaiRequestBody(env.OPENAI_API_MODEL, prompt);
  try {
    const response = await openaiClient.chat.completions.create({
      model: env.OPENAI_API_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log("OpenAI response: ", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    logger.error("Error sending request to OpenAI: ", error);
    throw new Error("Error sending request to OpenAI: " + error);
  }
};
