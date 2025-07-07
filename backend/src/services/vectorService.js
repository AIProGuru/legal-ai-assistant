require("dotenv").config();
const axios = require("axios");
const { Pinecone } = require("@pinecone-database/pinecone");
const { SocksProxyAgent } = require("socks-proxy-agent");

const proxyAgent = new SocksProxyAgent(process.env.PROXY_URL);

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

async function embedText(texts) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: texts,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        httpsAgent: proxyAgent, // ⬅️ use the proxy here
      }
    );

    return response.data.data.map((d) => d.embedding);
  } catch (err) {
    console.error("OpenAI embedding error:", err.response?.data || err.message);
    throw err;
  }
}
async function upsertToPinecone(chunks, embeddings, metadataBase) {
  const vectors = chunks.map((text, i) => ({
    id: `${metadataBase.templateId}-${metadataBase.filename}-${i}`,
    values: embeddings[i],
    metadata: {
      ...metadataBase,
      text,
      chunkIndex: i,
    },
  }));

  await index.upsert(vectors);
}

module.exports = { embedText, upsertToPinecone };