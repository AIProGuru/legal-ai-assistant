// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const { SocksProxyAgent } = require("socks-proxy-agent");
const OpenAI = require("openai");
const supabase = require("./src/integration/supabase/client");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const proxyUrl = process.env.PROXY_URL || "socks5h://127.0.0.1:1080";
const httpsAgent = new SocksProxyAgent(proxyUrl);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: httpsAgent,
});

const MEILISEARCH_API_KEY = process.env.MEILI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;


// -----------------------
// Utility: MeiliSearch
// -----------------------


const SEARCH_API_KEY = process.env.SEARCH_API_KEY;

async function searchWeb({ query, location = "" }) {
  const url = "https://www.searchapi.io/api/v1/search";
  const params = {
    engine: "bing",
    q: query,
    api_key: SEARCH_API_KEY,
  };

  if (location) {
    params.location = location; // Optional
  }

  try {
    const response = await axios.get(url, { params });
    const webResults = response.data.web_results || [];

    const formattedResults = webResults.slice(0, 5).map((result, index) => ({
      title: result.title,
      snippet: result.snippet,
      url: result.link,
      rank: index + 1,
    }));

    return formattedResults;
  } catch (error) {
    console.error("searchWeb error:", error.message);
    return `Error al buscar en la web: ${error.message}`;
  }
}


async function searchMeili(query, country) {
  const indexUrlMap = {
    "El Salvador": "https://api.docs.bufetemejia.com/indexes/El-Salvador-test/search",
    "Costa Rica": "https://api.docs.bufetemejia.com/indexes/COSTA-RICA/search",
    "Honduras": "https://api.docs.bufetemejia.com/indexes/HONDURAS/search",
    "Nicaragua": "https://api.docs.bufetemejia.com/indexes/Nicaragua/search",
    "Panama": "https://api.docs.bufetemejia.com/indexes/Panama/search",
    "Paraguay": "https://api.docs.bufetemejia.com/indexes/Paraguay/search",
    "Dominica": "https://api.docs.bufetemejia.com/indexes/Republica-Dominicana/search",
  };

  const indexUrl = indexUrlMap[country];
  if (!indexUrl) {
    console.warn(`No legal index found for country: ${country}`);
    return `⚠️ No legal search index is available for "${country}". Please provide a supported country (e.g., El Salvador, Costa Rica, Honduras, Nicaragua, Panama, Paraguay, and Dominica).`;
  }

  try {
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

    const hits = response.data.hits;
    if (!hits || hits.length === 0) return "⚠️ No relevant legal content found.";

    const formatted = hits
      .map((hit, index) =>
        `${index + 1}. law_title: ${hit.law_title ?? "N/A"}, type: ${hit.type ?? "N/A"}, title_number: ${hit.title?.number ?? "N/A"}, title_text: ${hit.title?.text ?? "N/A"}, chapter_number: ${hit.chapter?.number ?? "N/A"}, chapter_title: ${hit.chapter?.title ?? "N/A"}, section_number: ${hit.section?.number ?? "N/A"}, section_title: ${hit.section?.title ?? "N/A"}, article_number: ${hit.article?.number ?? "N/A"}, article_title: ${hit.article?.title ?? "N/A"}, content: ${hit.text ?? "N/A"}`
      )
      .join("\n\n");

    return formatted;
  } catch (error) {
    console.error("MeiliSearch error:", error.message);
    return "⚠️ Error occurred during legal search. Please try again later.";
  }
}

// ---------------------------
//  /admin/create-assistant
// ---------------------------
app.post("/admin/create-assistant", async (req, res) => {
  const systemPrompt = `
    ROL DEL ASISTENTE

    Eres un asistente legal experto en litigios de propiedad intelectual en la jurisdicción de Honduras. Tu tarea principal es redactar escritos legales completos, bien estructurados y persuasivos para presentaciones como: presentar oposición a registro de marca, contestación a oposición presentada por terceros, contestación a objeciones de la autoridad registradora, recurso de reposición, recurso de apelación, acciones de cancelación, acciones de nulidad y otros trámites ante las autoridades competentes de propiedad intelectual en Honduras.

    OBJETIVO PRINCIPAL:

    Elaborar escritos jurídicos sólidos y persuasivos que cumplan con la normativa hondureña y los convenios internacionales aplicables, siguiendo los requisitos formales y estilísticos de la jurisdicción. Debes guiar al usuario paso a paso, analizar exhaustivamente los detalles del caso y proponer argumentos y fundamentos legales adicionales cuando sea relevante.

    ESTRUCTURA GENERAL DEL ESCRITO:

    Cada escrito debe incluir las siguientes secciones (títulos en MAYÚSCULAS, excepto los que están entre corchetes y NUNCA numerados, siempre en español):

    1. [PÁRRAFO INICIAL DE RESUMEN]

    • Se redacta al final pero se coloca al inicio del escrito.
    • Resume la naturaleza del escrito y peticiones principales, en prosa legal, MAYÚSCULAS, NEGRITAS, con puntos entre cada idea. Ejemplo:

    “SE PRESENTA OPOSICIÓN AL REGISTRO DE UNA MARCA DE FÁBRICA.- SE ACOMPAÑAN DOCUMENTOS Y PODER DE REPRESENTACIÓN APOSTILLADO.- SE DESIGNA EL LUGAR DONDE OBRA DOCUMENTACIÓN ATINENTE AL CASO PARA LOS EFECTOS LEGALES CONSIGUIENTES.- APERTURA A PRUEBAS.- RESOLUCIÓN DEFINITIVA.”

    2. [LÍNEA DE AUTORIDAD]

    • Después del párrafo inicial, insertar una línea que indique la autoridad ante la que se presenta:
    “Señor Registrador de la Propiedad Intelectual - Instituto de la Propiedad:”
    • El asistente siempre debe solicitar esta información.

    3. [SECCIÓN COMPARECENCIA]

    • Inicia con: “Yo, [Nombre del abogado]…”
    • Redactar en primera persona, párrafo extenso y formal, incluyendo:
    • Nombre completo, número de colegiación, dirección, correo para notificaciones, condición en que actúa, mención del poder notarial.

    4. ANTECEDENTES (si aplica).

    5. INDICACIÓN CONCRETA DEL ACTO IMPUGNADO: Obligatorio solo en recursos de reposición y apelación. Debes solicitar esta información expresamente (número de resolución, fecha y breve descripción del acto en este tipo de recursos unicamente).

    6. HECHOS:

      • Cada hecho inicia en párrafo nuevo, enumerado como:
          PRIMERO:, SEGUNDO:, TERCERO:
      • Redactados en párrafos amplios, formales y jurídicos.
      o Si es Oposición: Redactar los hechos en párrafos extensos, enumerados (PRIMERO:, SEGUNDO:, etc.).
      o Si es Contestación a Oposición: Esta sección se convierte en Refutación de Argumentos, siguiendo este formato:
          PRIMERO: [Resumen del argumento del oponente]
          Contestación: [Refutación detallada y persuasiva].

    7. ORDEN DE ANÁLISIS

      • Todo desarrollo argumentativo debe colocarse antes de FUNDAMENTOS DE DERECHO y PETICIÓN, que serán siempre las dos últimas secciones.

    8. FUNDAMENTOS DE DERECHO: Citar la normativa hondureña y, cuando sea relevante, tratados internacionales aplicables o doctrina que pueda sustentarse o parafrasearse citando al autor.

    9. PETICIÓN: Un solo párrafo extenso, reiterando los datos relevantes de la comparecencia e indicando lo que se pide que la autoridad resuelva (nos conceda por ejemplo la reconsideracion de un examen de fondo o de forma, nos otorgue el derecho en la oposicion o accion de cancelacion o accion de nulidad interpuesta o desestime la oposicion, accion de cancelacion o accion de nulidad que nos interpusieron o admita el recurso de resposicion, reponiendo la resolucion recurrida o admita el recurso de apelacion si lo presentamos nosotros o lo desestime si fue la otra parte (contraparte) la que lo interpuso).

    10. CIERRE: Incluir “Tegucigalpa M.D.C., [FECHA]”, línea de firma y lista de anexos. No es necesario escribir el nombre del abogado, ni su colegiación en esta sección, solamente Tegucigalpa M.D.C., y la fecha.

    REGLAS DE INTERACCIÓN:

    • No solicites toda la información de una sola vez. Recolecta los datos por secciones, confirmando cada una antes de continuar.
    • Pregunta siempre en este orden:

    1. Tipo de escrito (Oposición, Contestación a Oposición, Reposición, Apelación, Cancelación, nulidad etc.).

    2. Autoridad ante la que se presenta.

    3. Datos del abogado: nombre, número de colegiación, dirección, correo, condición.

    4. Datos del cliente: nombre o razón social, representante legal, dirección.

    5. Datos de la marca defendida: denominación, número de solicitud o registro, clase de Niza, productos/servicios.

    6. Datos de la marca contraria (si aplica): denominación, número de solicitud, titular.

    7. Antecedentes.

    8. Hechos o argumentos (adaptar según tipo de escrito y las instrucciones arriba brindadas).

    9. Fundamentos legales: “¿Desea que incluya referencias a leyes nacionales y tratados internacionales?”

    10. Anexos: “¿Qué documentos acompañará al escrito?” ¿propondra documentos para aportarlos en el periodo probatorio?

      • En caso de Reposición o Apelación, preguntar:
        “Por favor, indique con exactitud el acto impugnado (número de resolución, fecha y breve descripción).”
      • Si falta información esencial, adviértelo.
      • Antes de redactar, confirmar:
        “¿Confirma que elabore el escrito completo con la información proporcionada y los fundamentos legales sugeridos?”

    ANÁLISIS JURÍDICO AVANZADO (OBLIGATORIO ANTES DE REDACTAR):

    Antes de generar el escrito, debes:
    1. Analizar con sentido critico cada argumento proporcionado por el usuario.
    2. Identificar las disposiciones legales relevantes utilizando la herramienta \searchLegalBasis\ en:
        o Ley de Propiedad Industrial de Honduras
        o Convenio de París
        o ADPIC (TRIPS)
        o Manual Armonizado de Criterios en Materia de Marcas de los paises centroamericanos y Republica Dominicana
        o Convenio de Berna cuando sea relevante en el analisis de un diseño de marca

    3. Sugerir fundamentos legales o doctrina adicionales (indicando artículos y citando autores), explicando:

        o Por qué aplica.

        o Cómo fortalece el caso.

    4. Preguntar:

      “¿Desea que incorpore estos fundamentos legales adicionales al escrito?”
      Esto aplica tanto para los argumentos del usuario como para los sugeridos por ti.

    REFERENCIAS A LEYES Y TRATADOS INTERNACIONALES:

    Siempre considerar:

      • Convenio de París
      • ADPIC (TRIPS)
      • Manual Armonizado (Centroamérica + República Dominicana)
      • Ley de Propiedad Industrial de Honduras

      o Convenio de Berna cuando sea relevante en el analisis de un diseño de marca

      Si es relevante, preguntar:
        “¿Desea que incluya referencias al [tratado específico] en la sección de fundamentos de derecho?”

    INVESTIGACIÓN EN INTERNET (CUANDO APLIQUE):

      • Si el usuario solicita verificar la notoriedad o comercialización de una marca:

        - Utiliza la herramienta /searchWeb/.
        - Presenta resultados únicamente de fuentes confiables (sitios oficiales, noticias relevantes, bases de datos reconocidas).
        - Muestra los enlaces como URLs planas para que puedan ser incluidos como anexos.

      • SI NO SE ENCUENTRA INFORMACIÓN SUFICIENTE EN LAS BASES DE DATOS LEGALES INTERNAS (por ejemplo, mediante /searchLegalBasis/), O NO SE LOGRA IDENTIFICAR FUNDAMENTO CLARO PARA UN ARGUMENTO:

        - Realiza automáticamente una búsqueda en internet con la herramienta /searchWeb/ para complementar el análisis.
        - Informa al usuario que se está utilizando una fuente externa para ampliar los argumentos.
        - Prioriza resultados de carácter oficial o académicamente reconocidos.

      • No inventes información. Si no se encuentra, indica claramente la limitación y sugiere al usuario incluir búsqueda documental en prueba.


    REQUISITOS DE REDACCIÓN:

      • Estilo formal, persuasivo y técnico en materia legal.
      • Cada sección debe desarrollarse en párrafos completos y extensos (NUNCA listas en la petición).
      • Enumerar únicamente los hechos o refutaciones (PRIMERO:, SEGUNDO:).
      • Incluir interpretaciones doctrinales o jurisprudenciales si se solicita o resulta pertinente.
      • Mantener siempre el formato de cierre oficial.
    

    IMPORTANTE: Actúa como un abogado especialista en litigios de propiedad intelectual, guiando al usuario paso a paso, asegurando que no falte ningún elemento esencial y proporcionando los argumentos legales más sólidos. Cumple estrictamente con las reglas anteriores, manteniendo formato, lenguaje jurídico y estructura exigida en Honduras. Sé exhaustivo, persuasivo y analiza a fondo cada hecho. Siempre inserta el párrafo inicial al principio y redacta títulos en el mismo idioma del escrito.
`;

  try {
    const assistant = await openai.beta.assistants.create({
      name: "Legal Drafting Assistant (8/7)",
      instructions: systemPrompt,
      model: "gpt-4o",
      tools: [
        {
          type: "function",
          function: {
            name: "searchLegalBasis",
            description: "Searches for relevant legal texts based on keywords and country",
            parameters: {
              type: "object",
              properties: {
                keywords: {
                  type: "string",
                  description: "Keywords to search legal content for",
                },
                country: {
                  type: "string",
                  description: "Country to restrict the legal search (e.g., El Salvador)",
                },
              },
              required: ["keywords", "country"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "searchWeb",
            description: "Performs a web search using Bing via searchapi.io",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to look up on the web",
                },
                location: {
                  type: "string",
                  description: "Optional location for more localized results (e.g. Tegucigalpa, Honduras)",
                },
              },
              required: ["query"],
            },
          }
        }
      ],
    });

    res.json({ message: "Assistant Created Successfully", id: assistant.id });
  } catch (error) {
    console.error("Assistant Creation Failed:", error.response?.data || error.message);
    res.status(500).send("Assistant Creation Failed");
  }
});

// ---------------------------
//  /api/chat
// ---------------------------
app.post("/api/chat", async (req, res) => {
  const { query, threadID, userID } = req.body;
  let currentThreadID = threadID;

  try {
    // Create thread if needed
    if (!currentThreadID) {
      const thread = await openai.beta.threads.create();
      currentThreadID = thread.id;
      const title = query.length > 50 ? query.slice(0, 47) + "..." : query;

      const { error } = await supabase
        .from("chat_threads")
        .insert([
          {
            user_id: userID,
            title,
            thread_id: currentThreadID,
          },
        ])
        .select();

      if (error) throw new Error("Supabase thread insert failed");
    }

    // Send user message
    await openai.beta.threads.messages.create(currentThreadID, {
      role: "user",
      content: query,
    });

    // Run the assistant
    let run = await openai.beta.threads.runs.createAndPoll(currentThreadID, {
      assistant_id: ASSISTANT_ID,
    });

    // If tool calls detected
    if (run.status === "requires_action" && run.required_action?.type === "submit_tool_outputs") {
      console.log("Detected tool call(s)");

      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let result;

          // Route to correct function
          switch (functionName) {
            case "searchLegalBasis": // alias for searchMeili
              result = await searchMeili(args.keywords, args.country);
              break;

            case "searchWeb":
              const args = JSON.parse(toolCall.function.arguments);
              const result = await searchWeb(args);
              return {
                tool_call_id: toolCall.id,
                output: result,
              };

            default:
              console.warn(`Unknown function: ${functionName}`);
              result = `Error: Function "${functionName}" not implemented`;
          }

          return {
            tool_call_id: toolCall.id,
            output: typeof result === "string" ? result : JSON.stringify(result),
          };
        })
      );

      console.log("Tool outputs", toolOutputs);

      // Submit tool outputs
      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(currentThreadID, run.id, {
        tool_outputs: toolOutputs,
      });
    }

    // Return final assistant message
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(currentThreadID);
      const final = messages.data[0].content[0].text.value;
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date() })
        .eq("thread_id", currentThreadID);

      return res.json({ response: final, threadID: currentThreadID });
    } else {
      return res.status(500).send("Run did not complete.");
    }
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    return res.status(500).send("Something went wrong.");
  }
});

// ---------------------------
//  /api/get-thread-history
// ---------------------------
app.post("/api/get-thread-history", async (req, res) => {
  const { threadId } = req.body;

  try {
    const messages = await openai.beta.threads.messages.list(threadId);
    const cleanMessages = messages.data.map((msg) => {
      let content = "";

      if (msg.content?.[0]?.type === "text") {
        content = msg.content[0].text.value;
      }

      return {
        id: msg.id,
        role: msg.role,
        content,
      };
    });

    res.json({ messages: cleanMessages });
  } catch (error) {
    console.error("Thread history error:", error.response?.data || error.message);
    res.status(500).send("Failed to get thread history");
  }
});

// ---------------------------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
