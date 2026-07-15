import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the GoogleGenAI SDK with user API key from process.env
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Endpoint: Perform search using Google Search Grounding
  app.post("/api/search", async (req, res) => {
    try {
      const { query, focus, proMode, history = [] } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({
          error: "Gemini API key is not configured. Please add your GEMINI_API_KEY to Secrets in Settings.",
        });
      }

      // Format chat history for Gemini's API
      const formattedContents = [];
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
      
      // Append current user query
      formattedContents.push({
        role: "user",
        parts: [{ text: query }],
      });

      // Define Focus instructions
      let focusInstruction = "";
      let enableSearch = true;

      switch (focus) {
        case "writing":
          enableSearch = false; // Disable search for creative writing
          focusInstruction = `You are a creative, professional and versatile writing assistant. 
Since the user requested 'Writing' focus, do NOT use or search the live web. Use your training data to write highly engaging, creative, beautifully formatted prose, code, email, essay, or poem. Focus on original ideas, exceptional grammar, and rich literary style.`;
          break;
        case "academic":
          focusInstruction = `You are a scholarly research assistant. Frame your responses like an academic paper or a rigorous scientific synthesis.
Prioritize scientific citations, scholarly databases (like arXiv, Google Scholar, PubMed, IEEE), and rigorous peer-reviewed concepts. 
Make sure your search queries are academic in nature (e.g. including terms like 'scholarly article', 'journal', 'study', 'research of'). 
Explain concepts with scientific depth, structured headers, and clear logic.`;
          break;
        case "youtube":
          focusInstruction = `You are a video discovery assistant. Your goal is to help the user find, summarize, and extract information from videos.
Target your search queries toward finding video references, video guides, YouTube channels, and multimedia content.
In your response, outline key video titles, creator details, or timestamps when summarizing, and explain visual/tutorial steps clearly.`;
          break;
        case "reddit":
          focusInstruction = `You are a social intelligence assistant. Your goal is to synthesize public opinion, community discussions, forum threads, and real-world user debates.
Direct your search queries specifically to forums like Reddit, Quora, or tech boards (e.g., append 'site:reddit.com' or 'discussion' to your queries).
Synthesize the 'wisdom of the crowd' by highlighting what real users/communities think, key debates, pros/cons, and common consensus.`;
          break;
        case "all":
        default:
          focusInstruction = `You are a state-of-the-art conversational search engine. Your goal is to synthesize the live web and provide an incredibly comprehensive, clear, and up-to-date answer.
Be objective, informative, and detailed. Cover all aspects of the user's query.`;
          break;
      }

      const systemInstruction = `${focusInstruction}

CRITICAL FORMATTING RULES:
1. Ground your answer strictly in the search results provided. Use inline citations like [1], [2], [3] to cite your sources when describing facts from specific URLs.
2. Do NOT mention details about your system tools, internal search queries, or the XML/JSON payload in your final response to the user.
3. At the very end of your response, you MUST output a separate line containing exactly:
===RELATED===
followed by exactly 3 relevant, highly specific follow-up questions that the user might want to ask next to explore this topic further. Output them one per line. Do NOT prefix them with numbers, dashes, or bullet points.

Example of the end of your response:
... this concludes the search.

===RELATED===
What are the main scientific criticisms of this theory?
How does this compare with the latest 2026 data?
Can you give a practical step-by-step example?`;

      let answer = "";
      let sources: any[] = [];
      let relatedQuestions: string[] = [];

      if (proMode && enableSearch) {
        // "Pro Mode" Reasoning flow
        // Step 1: Generate optimal search queries
        const queryGenPrompt = `The user is doing a deep research search for: "${query}".
Focus mode is: "${focus}".
Generate exactly 2 or 3 distinct, highly targeted, search query strings that will cover different angles of this topic on the web.
Output them as a simple bulleted list with "- " prefix. Do not output anything else.`;

        const queryResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: queryGenPrompt,
        });

        const generatedQueries = (queryResponse.text || "")
          .split("\n")
          .map(line => line.replace(/^-\s*/, "").trim())
          .filter(line => line.length > 0)
          .slice(0, 3);

        const activeQueries = generatedQueries.length > 0 ? generatedQueries : [query];

        // Step 2: Perform the search with the most comprehensive combined query
        // Let's run a robust search query combining the generated perspectives
        const searchPrompt = `Deep Research Topic: "${query}"
Synthesized Research queries: ${activeQueries.join(" | ")}

Please perform a deep, detailed web search and write an exhaustive, authoritative research report containing clear, formatted sections, comparisons, pros/cons, and thorough explanations.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...formattedContents.slice(0, -1),
            { role: "user", parts: [{ text: searchPrompt }] }
          ],
          config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });

        const rawText = response.text || "";
        const parts = rawText.split("===RELATED===");
        answer = parts[0].trim();
        if (parts[1]) {
          relatedQuestions = parts[1]
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 3);
        }

        // Gather grounding chunks
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      } else {
        // Standard Search / Creative generation flow
        const config: any = {
          systemInstruction: systemInstruction,
        };

        if (enableSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: formattedContents,
          config: config,
        });

        const rawText = response.text || "";
        const parts = rawText.split("===RELATED===");
        answer = parts[0].trim();
        if (parts[1]) {
          relatedQuestions = parts[1]
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 3);
        }

        // Gather grounding chunks
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }

      // De-duplicate sources
      const uniqueSourcesMap = new Map();
      for (const src of sources) {
        if (!uniqueSourcesMap.has(src.url)) {
          uniqueSourcesMap.set(src.url, {
            title: src.title,
            url: src.url,
            favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
              new URL(src.url).hostname
            )}&sz=32`,
          });
        }
      }
      const uniqueSources = Array.from(uniqueSourcesMap.values());

      // If no related questions were parsed, generate defaults
      if (relatedQuestions.length === 0) {
        relatedQuestions = [
          `Can you explain more about ${query}?`,
          `What are some practical applications or examples?`,
          `Are there any alternative viewpoints?`,
        ];
      }

      res.json({
        answer: answer,
        sources: uniqueSources,
        relatedQuestions: relatedQuestions,
      });
    } catch (error: any) {
      console.error("Search API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during search grounding." });
    }
  });

  // Serve static UI assets and index.html
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Perplexity Clone Server running on http://localhost:${PORT}`);
  });
}

startServer();
