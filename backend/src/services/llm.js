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


async function searchMeili(query, country) {
  const indexUrlMap = {
    "El Salvador": "https://api.docs.bufetemejia.com/indexes/El-Salvador-test/search",
    "Costa Rica": "https://api.docs.bufetemejia.com/indexes/COSTA-RICA/search",
    "Honduras": "https://api.docs.bufetemejia.com/indexes/HONDURAS/search",
  };

  const indexUrl = indexUrlMap[country];

  if (!indexUrl) {
    throw new Error(`No index URL configured for country: ${country}`);
  }

  const response = await axios.post(
    indexUrl,
    {
      q: query,
      limit: 5,
      hybrid: {
        semanticRatio: 1,
        embedder: "default",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${MEILISEARCH_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

async function generateSectionDrafts(templateId, inputs) {
  const template = await Template.findById(templateId);
  if (!template) throw new Error("Template not found");

  const drafts = {};

  for (const section of template.sections) {
    const title = section.title;
    const description = section.description;
    const sampleDraft = section.sample_draft;
    const userInput = inputs[title] || "";
    const requireMeilisearch = section.requires_meilisearch;

    const queryVector = await embedText(title + " " + description);

    // Default to Honduras unless otherwise inferred from template/inputs
    const country = template.country || "Honduras";

    let meiliReferences = "";

    if (requireMeilisearch && userInput?.trim()) {
      try {
        const meiliResult = await searchMeili(userInput, country);

        if (meiliResult?.hits?.length > 0) {
          meiliReferences = meiliResult.hits
            .map(
              (hit, index) =>
                `${index + 1}. law_title: ${hit.law_title ?? null}, type: ${hit.type ?? null}, title_number: ${hit.title?.number ?? null}, title_text: ${hit.title?.text ?? null} chapter_number: ${hit.chapter?.number ?? null}, chapter_title: ${hit.chapter?.title ?? null}, section_number: ${hit.section?.number ?? null}, section_title: ${hit.section?.title ?? null}, artitle_number: ${hit.article?.number ?? null}, article_title: ${hit.article?.title ?? null} content: ${hit.text ?? null}`
            )
            .join("\n\n");
        }
      } catch (err) {
        console.warn(`Failed to fetch from MeiliSearch: ${err.message}`);
      }
    }

    const prompt = `
      You are a legal drafting assistant. Your task is to write the "${title}" section of a "${template.name}" legal document.

      Below is a general example or description of what this section typically includes:
      ${description || "[No description provided]"}

      Below is a sample draft, which shows the general style and tone to follow (not the actual content):
      ${sampleDraft || "[No sample draft provided]"}

      Relevant legal references based on the user's input:
      ${meiliReferences || "[No related legal references found.]"}

      Now, based on the user's case-specific details below, generate a clear, detailed, and legally sound version of this section:
      ${userInput}

      ⚠️ If the user's input appears to be placeholder or meaningless (e.g., repeated words like "test test test", gibberish, or empty content), respond with:
      "⚠️ Unable to generate meaningful content due to insufficient or unclear case details."

      Ensure your response uses the same language as the user's input. Only respond with the generated draft for this section — not the full document.

      Draft:
    `;

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
