// services/llm.js

const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const pinecone = require("../utils/pinecone");
const Template = require("../models/Template");

const proxyUrl = process.env.PROXY_URL || "socks5h://127.0.0.1:1080";
const proxyAgent = new SocksProxyAgent(proxyUrl);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

async function generateSectionDrafts(templateId, inputs) {
  const template = await Template.findById(templateId);
  if (!template) throw new Error("Template not found");

  const drafts = {};
  console.log("from db", template)

  for (const section of template.sections) {
    const title = section.title;
    const description = section.description;
    const userInput = inputs[title] || "";

    // Step 1: Embed the section title + user input
    const queryVector = await embedText(title + " " + description);

    // Step 2: Search Pinecone
    // const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    // const searchResult = await pineconeIndex.query({
    //   vector: queryVector,
    //   topK: 5,
    //   includeMetadata: true,
    //   filter: { templateName: template.name },
    // });

    // const references = searchResult.matches
    //   .map((match) => match.metadata?.text || "")
    //   .join("\n\n");

    // Step 3: Compose prompt
    const prompt = `
      You are a legal drafting assistant. Your task is to write the "${title}" section of a "${template.name}" legal document.

      Below is a general example or description of what this section typically includes:
      ${description}

      Now, based on the user's specific case details provided below, draft a clear, legally sound version of this section:
      ${userInput}

      Make it as detail as you can.

      Draft:
    `;
    // Step 4: Generate draft via OpenAI
    const generatedText = await generateChat([{ role: "user", content: prompt }]);
    drafts[title] = generatedText;
  }

  return drafts;
}

async function embedText(input) {
  try {
    const response = await axios.post(
      EMBEDDING_URL,
      {
        model: "text-embedding-3-small",
        input,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        httpsAgent: proxyAgent,
      }
    );

    return response.data.data[0].embedding;
  } catch (err) {
    console.error("OpenAI embedding error:", err.response?.data || err.message);
    throw err;
  }
}

async function generateChat(messages) {
  try {
    const response = await axios.post(
      CHAT_URL,
      {
        model: "gpt-4",
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        httpsAgent: proxyAgent,
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("OpenAI chat error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { generateSectionDrafts };
