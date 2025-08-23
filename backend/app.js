// server.js
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const { SocksProxyAgent } = require("socks-proxy-agent");
const OpenAI = require("openai");
const supabase = require("./src/integration/supabase/client");

const app = express();
app.use(morgan("dev"));

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

    return formattedResults
      .map(r => `(${r.rank}) ${r.title}\n${r.snippet}\n${r.url}`)
      .join("\n\n");
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
  const systemPrompt = String.raw`
# ROL DEL ASISTENTE

**Eres un abogado especialista en litigios de propiedad intelectual en Honduras.** Tu tarea es redactar **ESCRITOS LEGALES COMPLETOS, EXTENSOS (equivalente a 6-10 páginas)** y altamente persuasivos para: oposición a registro de marca, contestación a oposición, contestación a objeciones, recurso de reposición, recurso de apelación, cancelación, nulidad y demás trámites ante autoridades de PI en Honduras.

**IMPORTANTE: SIEMPRE GENERA DOCUMENTOS EXTENSOS. NUNCA ENTREGUES RESÚMENES CORTOS. EL OBJETIVO ES 3000-5000 PALABRAS MÍNIMO.**

---

## 🎯 OBJETIVO PRINCIPAL

Elaborar documentos jurídicos sólidos, exhaustivos y formales que cumplan la normativa hondureña y los tratados internacionales aplicables. Debes **guiar al usuario paso a paso**, **confirmar y analizar** cada dato antes de pasar al siguiente, y **proponer fundamentos y argumentos adicionales** cuando sea pertinente.

---

## 🧰 POLÍTICA DE HERRAMIENTAS (OBLIGATORIA)

1) **\`searchLegalBasis\` (FUENTE PRINCIPAL):**
   - ÚSALA SIEMPRE en dos momentos mínimos:
     - **(A)** Tras reunir tipo de escrito, marcas y puntos de conflicto (para mapear los fundamentos).
     - **(B)** **Antes de redactar “FUNDAMENTOS DE DERECHO”** (para citar artículos exactos).
   - Si el usuario provee título/capítulo/artículo, **úsalo como keywords**. Si no, **infiere keywords** del contexto (p. ej., “confundibilidad”, “similitud de signos”, “artículo 84 LPI Honduras”, “prohibiciones relativas”, “notoriedad”).
   - **Country**: “Honduras”.
   - **Integración obligatoria** en el texto:
     - **Nombre de la norma + artículo/numeral**.
     - **Cita textual breve** entre comillas (si el resultado trae texto).
     - **Paráfrasis aplicada al caso** (explica cómo se aplica).
     - **Referencia a la fuente del DB** (ID o metadatos si están disponibles).
   - **No inventes** artículos. **Si \`searchLegalBasis\` no devuelve resultados relevantes**, dilo expresamente y sugiere alternativas.

2) **\`searchWeb\` (COMPLEMENTARIA):**
   - Solo cuando:
     - El usuario solicite probar **notoriedad/comercialización/uso en el mercado**, o
     - **\`searchLegalBasis\` sea insuficiente** para doctrina/jurisprudencia complementaria.
   - Prioriza **fuentes oficiales o académicas**. Devuelve **URLs en texto plano** para anexos.
   - Señala claramente que provienen de **fuentes externas**.

---

## 🔄 REGLAS DE INTERACCIÓN (PASO A PASO)

- **No solicites todo de golpe.** Pide los datos **uno por uno**, **confirma la recepción**, haz una **validación o mini-análisis jurídico** de ese dato, y **recién entonces** pide el siguiente.
- Orden recomendado:
  1) Tipo de escrito
  2) Autoridad ante la que se presenta
  3) Datos del abogado (nombre, colegiación, domicilio, email, poder)
  4) Datos del cliente
  5) Marca defendida (denominación, expediente/registro, clase Niza, productos/servicios)
  6) Marca contraria (si aplica)
  7) Antecedentes
  8) Hechos / argumentos (oposición: hechos extensos; contestación: refutaciones)
  9) Fundamentos legales (pregunta si desea incluir leyes y tratados internacionales)
  10) Anexos (y si propondrá prueba documental en periodo probatorio)
- Para **reposición/apelación**, solicita **acto impugnado** (resolución, fecha, breve descripción).
- Si falta algo, usa **[Insertar dato aquí]** y avisa.
- Antes de redactar: **“¿Confirma que elabore el escrito completo con la información proporcionada y los fundamentos legales sugeridos?”**

---

## ⚖️ ANÁLISIS JURÍDICO AVANZADO (ANTES DE REDACTAR)

- Analiza críticamente los argumentos del usuario.
- Identifica y **extrae con \`searchLegalBasis\`** disposiciones de:
  - **Ley de Propiedad Industrial de Honduras** (p. ej., arts. sobre confundibilidad, prohibiciones relativas/absolutas, nulidad/cancelación).
  - **Convenio de París** (p. ej., art. 6 quinquies, 10 bis si aplica).
  - **ADPIC (TRIPS)** (p. ej., art. 16).
  - **Manual Armonizado de Criterios en Materia de Marcas** (CA + RD).
  - **Convenio de Berna** (si el análisis involucra elementos de obra/diseño).
- Sugiere fundamentos adicionales (artículos y doctrina), explica **por qué aplican** y **cómo fortalecen** el caso.
- Pregunta: **“¿Desea que incorpore estos fundamentos legales adicionales al escrito?”**

---

## 📑 ESTRUCTURA OBLIGATORIA DEL ESCRITO

> **No incluyas una sección llamada “ORDEN DE ANÁLISIS”.** El desarrollo argumental se integra en **HECHOS/REFUTACIONES** y en **FUNDAMENTOS DE DERECHO**.

1. **[PÁRRAFO INICIAL DE RESUMEN]**  
   - **MAYÚSCULAS y NEGRITAS**, escrito **al final** pero colocado **al principio**.  
   - Resume naturaleza del escrito y todas las peticiones **(≥150-200 palabras)**, con **puntos** entre ideas.

2. **[LÍNEA DE AUTORIDAD]**  
   - “Señor Registrador de la Propiedad Intelectual - Instituto de la Propiedad:”

3. **[COMPARECENCIA]**  
   - Inicia con: **“Yo, [Nombre del abogado]…”**  
   - Párrafo **extenso** en primera persona: nombre, colegiación, domicilio, email, calidad de actuación, **mención de poder**.

4. **ANTECEDENTES** (si aplica)  
   - Desarrollo **amplio** (meta: ≈ 1 página).

5. **INDICACIÓN CONCRETA DEL ACTO IMPUGNADO** (solo en reposición/apelación)  
   - Número de resolución, fecha, breve descripción.

6. **HECHOS** (u **REFUTACIÓN DE ARGUMENTOS** en contestaciones)  
   - **Enumerados**: **PRIMERO:**, **SEGUNDO:**, **TERCERO:** …  
   - Cada ítem debe ser un **párrafo extenso (≥200 palabras)** con **análisis** (vincula con criterios del Manual Armonizado, similitud fonética/visual/ideológica, consumidor medio, canales de comercialización, coexistencia, etc.).  
   - En **contestación**:  
     - **PRIMERO: [Resumen del argumento del oponente]**  
       **Contestación:** [Refutación extensa, técnica y persuasiva].

7. **FUNDAMENTOS DE DERECHO** (**muy desarrollada**)  
   - **Usa \`searchLegalBasis\` obligatoriamente** para integrar **artículos y numerales específicos**.  
   - Para **cada** fundamento relevante:
     - **Cita**: “Art. X (numeral Y), [Nombre de la norma] — \\"[cita textual breve del DB]\\".”  
     - **Aplicación al caso**: explica paso a paso la pertinencia.  
   - Incluye, cuando aplique: **Art. 84 LPI Honduras** (confundibilidad), **Art. 6 quinquies Convenio de París**, **Art. 16 ADPIC**, criterios del **Manual Armonizado**, y doctrina.  
   - Extensión objetivo: **≥ 2 páginas** equivalentes.

8. **PETICIÓN**  
   - **Un solo párrafo amplio (≥200-250 palabras)**, reiterando datos esenciales, marcas involucradas y fundamentos invocados, con redacción solemne y clara.

9. **CIERRE**  
   - “**Tegucigalpa M.D.C., [FECHA]**”  
   - Línea de **firma**  
   - **ANEXOS** (lista)

---

## ✍️ REQUISITOS DE REDACCIÓN Y EXTENSIÓN

- Estilo **formal, técnico y persuasivo** (registro forense hondureño).  
- Producir un documento **extenso** (objetivo: **equivalente a 6-10 páginas**).  
- **Cada sección** relevante con **párrafos largos**; evita listas en **PETICIÓN**.  
- **Hechos/Refutaciones** obligatoriamente enumerados (PRIMERO, SEGUNDO…).  
- **Fundamentos** con citas **explícitas** (norma, artículo, numeral y **cita textual** cuando el DB lo permita).  
- **No inventes** citas ni artículos; si el DB no trae texto, indícalo y explica la norma de forma razonada.  
- Mantén **títulos en español y en MAYÚSCULAS**.  
- **No entregar resúmenes** ni “modelos cortos”.

---

## 🌐 INVESTIGACIÓN EN INTERNET (CUANDO PROCEDA)

- Para **notoriedad/comercialización/uso**: utiliza **\`searchWeb\`**, muestra **URLs planas** y sugiere anexarlas.  
- Si \`searchLegalBasis\` fuera insuficiente para doctrina/jurisprudencia: **complementa con \`searchWeb\`** y **deja claro** que es fuente externa.

---

## ✅ VERIFICACIONES FINALES (CHECKLIST)

- ¿Se usó **\`searchLegalBasis\`** en los puntos A y B?  
- ¿Se integraron **artículos con cita textual/paráfrasis** y pertinencia?  
- ¿Hechos/Refutaciones** enumerados** y **extensos**?  
- ¿**PETICIÓN** en **un solo párrafo** y **amplia**?  
- ¿**PÁRRAFO INICIAL** en mayúsculas y **al inicio**?  
- ¿**Cierre** con Tegucigalpa M.D.C., fecha, firma y **anexos**?  
- ¿Sin sección llamada **“Orden de análisis”**?

  `;
;

  try {
    const assistant = await openai.beta.assistants.create({
      name: "Legal Drafting Assistant (8/22)",
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
              result = await searchWeb(args); // no redeclaration
              break;

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



app.post("/api/searchWeb", async (req, res) => {
  const { query, location } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const result = await searchWeb({ query, location });
  res.send(result);
});

// ---------------------------
//  /api/generate-legal-document
// ---------------------------
app.post("/api/generate-legal-document", async (req, res) => {
  const { query, threadID, userID, documentType, country = "Honduras" } = req.body;
  let currentThreadID = threadID;

  try {
    // Create thread if needed
    if (!currentThreadID) {
      const thread = await openai.beta.threads.create();
      currentThreadID = thread.id;
      const title = `Legal Document: ${documentType || 'Draft'}`;

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

    // Step 1: Research and Analysis Phase
    const researchPrompt = `INICIA FASE DE INVESTIGACIÓN Y ANÁLISIS JURÍDICO

Para el siguiente caso: ${query}

Documento: ${documentType}

REALIZA LOS SIGUIENTES PASOS:

1. **BÚSQUEDA LEGAL OBLIGATORIA**: Usa searchLegalBasis para encontrar:
   - Artículos relevantes de la Ley de Propiedad Industrial de ${country}
   - Tratados internacionales aplicables (Convenio de París, ADPIC, etc.)
   - Jurisprudencia y doctrina relacionada
   - Manual Armonizado de Criterios en Materia de Marcas

2. **ANÁLISIS JURÍDICO DETALLADO**: 
   - Identifica todos los fundamentos legales aplicables
   - Analiza los hechos desde múltiples perspectivas jurídicas
   - Identifica argumentos adicionales que fortalezcan el caso
   - Sugiere pruebas y evidencias que podrían presentarse

3. **ESTRUCTURA DOCUMENTAL COMPLETA**:
   - Define la estructura detallada del documento (mínimo 8 secciones principales)
   - Para cada sección, especifica qué contenido debe incluir
   - Establece la extensión objetivo para cada sección

4. **CONFIRMACIÓN DE DATOS**:
   - Lista todos los datos que necesitas del usuario
   - Solicita información adicional que podría fortalecer el caso

OBJETIVO: Generar un análisis jurídico exhaustivo que sirva como base para un documento de 6-10 páginas.`;

    await openai.beta.threads.messages.create(currentThreadID, {
      role: "user",
      content: researchPrompt,
    });

    let run = await openai.beta.threads.runs.createAndPoll(currentThreadID, {
      assistant_id: ASSISTANT_ID,
    });

    // Handle tool calls for research phase
    if (run.status === "requires_action" && run.required_action?.type === "submit_tool_outputs") {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let result;

          switch (functionName) {
            case "searchLegalBasis":
              result = await searchMeili(args.keywords, args.country);
              break;
            case "searchWeb":
              result = await searchWeb(args);
              break;
            default:
              result = `Error: Function "${functionName}" not implemented`;
          }

          return {
            tool_call_id: toolCall.id,
            output: typeof result === "string" ? result : JSON.stringify(result),
          };
        })
      );

      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(currentThreadID, run.id, {
        tool_outputs: toolOutputs,
      });
    }

    // Step 2: Document Drafting Phase
    const draftingPrompt = `INICIA FASE DE REDACCIÓN DEL DOCUMENTO COMPLETO

Basándote en la investigación anterior, procede a redactar el documento legal completo.

REQUISITOS OBLIGATORIOS:

1. **EXTENSIÓN MÍNIMA**: El documento debe tener al menos 6-10 páginas equivalentes (aproximadamente 3000-5000 palabras)

2. **ESTRUCTURA DETALLADA**:
   - PÁRRAFO INICIAL DE RESUMEN (≥200 palabras)
   - COMPARECENCIA (extensa, con todos los datos del abogado)
   - ANTECEDENTES (desarrollo amplio, ≈1 página)
   - HECHOS/REFUTACIONES (enumerados, cada uno ≥200 palabras)
   - FUNDAMENTOS DE DERECHO (muy desarrollada, ≥2 páginas)
   - PETICIÓN (un párrafo amplio, ≥250 palabras)
   - CIERRE Y ANEXOS

3. **CONTENIDO RICO**:
   - Integra TODOS los artículos encontrados en la investigación
   - Incluye citas textuales cuando estén disponibles
   - Desarrolla argumentos desde múltiples perspectivas
   - Añade análisis jurídico detallado en cada sección

4. **ESTILO Y FORMATO**:
   - Lenguaje formal y técnico
   - Párrafos extensos y bien desarrollados
   - Enumeración clara de hechos y fundamentos
   - Citas apropiadas y referencias

5. **VERIFICACIÓN DE EXTENSIÓN**:
   - Al final, confirma la extensión del documento
   - Si es menor a 6 páginas, identifica secciones que necesitan expansión
   - Expande las secciones más importantes (Fundamentos de Derecho, Hechos, Antecedentes)

REDACTAR EL DOCUMENTO COMPLETO AHORA.`;

    await openai.beta.threads.messages.create(currentThreadID, {
      role: "user",
      content: draftingPrompt,
    });

    run = await openai.beta.threads.runs.createAndPoll(currentThreadID, {
      assistant_id: ASSISTANT_ID,
    });

    // Handle tool calls for drafting phase
    if (run.status === "requires_action" && run.required_action?.type === "submit_tool_outputs") {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let result;

          switch (functionName) {
            case "searchLegalBasis":
              result = await searchMeili(args.keywords, args.country);
              break;
            case "searchWeb":
              result = await searchWeb(args);
              break;
            default:
              result = `Error: Function "${functionName}" not implemented`;
          }

          return {
            tool_call_id: toolCall.id,
            output: typeof result === "string" ? result : JSON.stringify(result),
          };
        })
      );

      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(currentThreadID, run.id, {
        tool_outputs: toolOutputs,
      });
    }

    // Step 3: Review and Enhancement Phase
    const reviewPrompt = `FASE FINAL: REVISIÓN Y MEJORA DEL DOCUMENTO

REALIZA UNA REVISIÓN EXHAUSTIVA DEL DOCUMENTO GENERADO:

1. **VERIFICACIÓN DE EXTENSIÓN**:
   - Cuenta las palabras del documento
   - Si es menor a 3000 palabras, identifica secciones que necesitan expansión
   - Expande las secciones más importantes (Fundamentos de Derecho, Hechos, Antecedentes)

2. **MEJORAS DE CONTENIDO**:
   - Añade argumentos jurídicos adicionales
   - Incluye más citas y referencias legales
   - Desarrolla mejor los análisis de confundibilidad
   - Añade consideraciones sobre el consumidor medio
   - Incluye análisis de canales de comercialización

3. **ESTRUCTURA Y COHERENCIA**:
   - Verifica que todas las secciones estén completas
   - Asegura que los argumentos fluyan lógicamente
   - Confirma que la petición sea clara y completa

4. **LENGUAJE Y ESTILO**:
   - Verifica el uso de lenguaje formal y técnico
   - Asegura que los párrafos sean extensos y bien desarrollados
   - Confirma el uso apropiado de citas y referencias

SI EL DOCUMENTO NO ALCANZA LA EXTENSIÓN OBJETIVO, EXPÁNDELO SIGNIFICATIVAMENTE.

ENTREGA EL DOCUMENTO FINAL COMPLETO Y MEJORADO.`;

    await openai.beta.threads.messages.create(currentThreadID, {
      role: "user",
      content: reviewPrompt,
    });

    run = await openai.beta.threads.runs.createAndPoll(currentThreadID, {
      assistant_id: ASSISTANT_ID,
    });

    // Handle tool calls for review phase
    if (run.status === "requires_action" && run.required_action?.type === "submit_tool_outputs") {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let result;

          switch (functionName) {
            case "searchLegalBasis":
              result = await searchMeili(args.keywords, args.country);
              break;
            case "searchWeb":
              result = await searchWeb(args);
              break;
            default:
              result = `Error: Function "${functionName}" not implemented`;
          }

          return {
            tool_call_id: toolCall.id,
            output: typeof result === "string" ? result : JSON.stringify(result),
          };
        })
      );

      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(currentThreadID, run.id, {
        tool_outputs: toolOutputs,
      });
    }

    // Return final document
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(currentThreadID);
      const final = messages.data[0].content[0].text.value;
      
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date() })
        .eq("thread_id", currentThreadID);

      return res.json({ 
        response: final, 
        threadID: currentThreadID,
        documentType: documentType,
        generationMethod: "agentic-multi-step"
      });
    } else {
      return res.status(500).send("Document generation did not complete.");
    }
  } catch (err) {
    console.error("Document generation error:", err.response?.data || err.message);
    return res.status(500).send("Something went wrong during document generation.");
  }
});

// ---------------------------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
