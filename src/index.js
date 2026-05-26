export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path === "/api/latest") {
      return handleLatest(env);
    }
    if (path === "/api/logs") {
      return handleLogs(env);
    }
    if (path === "/api/intake" && request.method === "POST") {
      return handleIntake(request, env);
    }
    if (path === "/api/current-rules") {
      return handleCurrentRules(env);
    }
    if (path === "/api/collect-log" && request.method === "POST") {
      return handleCollectLog(request, env);
    }
    if (path === "/api/collected-logs") {
      return handleCollectedLogs(env);
    }
    if (path === "/api/consolidate" && request.method === "POST") {
      return handleConsolidate(request, env);
    }
    if (path === "/api/organize-log" && request.method === "POST") {
      return handleOrganizeLog(request, env);
    }

    // Admin Page
    if (path === "/admin" || path === "/admin/") {
      return serveStaticAsset("/admin/index.html", env);
    }

    // Collect Page
    if (path === "/collect" || path === "/collect/") {
      return serveStaticAsset("/collect/index.html", env);
    }

    // Fallback to static assets
    return env.ASSETS.fetch(request);
  }
};

async function handleLatest(env) {
  try {
    // Return newest entry where supersedes_previous is true,
    // or newest checkpoint entry if available.
    const result = await env.DB.prepare(`
      SELECT * FROM handoff_entries
      WHERE supersedes_previous = 1 OR type = 'checkpoint'
      ORDER BY created_at DESC LIMIT 1
    `).first();

    if (!result) {
      return new Response(JSON.stringify({ message: "No entries found. Use /ai-handoff.json as fallback." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleLogs(env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM handoff_entries
      ORDER BY created_at DESC LIMIT 50
    `).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleIntake(request, env) {
  const token = env.UPDATE_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "UPDATE_TOKEN setup error. Please set the secret." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = request.headers.get("Authorization");
  const body = await request.json();
  const requestToken = body.token || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);

  if (requestToken !== token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { type, title, content, tags, source_chat, confidence_level, supersedes_previous } = body;

    const { lastRowId } = await env.DB.prepare(`
      INSERT INTO handoff_entries (type, title, content, tags, source_chat, confidence_level, supersedes_previous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      type,
      title || null,
      content,
      tags || null,
      source_chat || null,
      confidence_level || null,
      supersedes_previous ? 1 : 0
    ).run();

    return new Response(JSON.stringify({ success: true, id: lastRowId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleCollectLog(request, env) {
  const token = env.UPDATE_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "UPDATE_TOKEN setup error. Please set the secret." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = request.headers.get("Authorization");
  const body = await request.json();
  const requestToken = body.token || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);

  if (requestToken !== token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { title, content, tags, source_chat, confidence_level } = body;
    // Ensure type is 'collected_log' for this endpoint
    const type = 'collected_log';
    const supersedes_previous = false; // Collected logs don't supersede by default

    const { lastRowId } = await env.DB.prepare(`
      INSERT INTO handoff_entries (type, title, content, tags, source_chat, confidence_level, supersedes_previous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      type,
      title || null,
      content,
      tags || null,
      source_chat || null,
      confidence_level || null,
      supersedes_previous ? 1 : 0
    ).run();

    return new Response(JSON.stringify({ success: true, id: lastRowId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleCollectedLogs(env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, title, content, tags, source_chat, confidence_level, created_at
      FROM handoff_entries
      WHERE type = 'collected_log'
      ORDER BY created_at DESC LIMIT 100
    `).all(); // Limit to 100 collected logs for practicality

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleConsolidate(request, env) {
  const token = env.UPDATE_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "UPDATE_TOKEN setup error. Please set the secret." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = request.headers.get("Authorization");
  const body = await request.json();
  const requestToken = body.token || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);

  if (requestToken !== token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { results: collectedLogs } = await env.DB.prepare(`
      SELECT content FROM handoff_entries
      WHERE type = 'collected_log'
      ORDER BY created_at ASC
    `).all();

    if (collectedLogs.length === 0) {
      return new Response(JSON.stringify({ message: "No collected logs to consolidate." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const consolidatedContent = collectedLogs.map(log => log.content).join("\n\n--- CONSOLIDATED ENTRY ---\n\n");
    const checkpointTitle = `Consolidated Checkpoint - ${new Date().toISOString()}`;

    // Insert new checkpoint
    const { lastRowId } = await env.DB.prepare(`
      INSERT INTO handoff_entries (type, title, content, tags, source_chat, confidence_level, supersedes_previous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'checkpoint', // type
      checkpointTitle, // title
      consolidatedContent, // content
      'consolidated,auto-generated', // tags
      'system:consolidate', // source_chat
      'high', // confidence_level
      1 // supersedes_previous
    ).run();

    return new Response(JSON.stringify({ success: true, checkpointId: lastRowId, message: "Logs consolidated into a new checkpoint." }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function handleOrganizeLog(request, env) {
  const token = env.UPDATE_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "UPDATE_TOKEN setup error. Please set the secret." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = request.headers.get("Authorization");
  const body = await request.json();
  const requestToken = body.token || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);

  if (requestToken !== token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const geminiApiKey = env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set. Please configure the environment variable to use this feature." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { content: rawLogContent } = body;
    if (!rawLogContent) {
      return new Response(JSON.stringify({ error: "Missing 'content' in request body." }), { status: 400 });
    }

    const prompt = `Organize the following messy chat log into clear, concise, and structured bullet points or a summary. Focus on key information, decisions, and action items. If possible, identify the core subject. Keep the output strictly in markdown format.

Messy Log:
${rawLogContent}

Organized Log:`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok || !geminiData.candidates || geminiData.candidates.length === 0) {
      console.error("Gemini API error:", geminiData);
      return new Response(JSON.stringify({ error: "Failed to get organized content from Gemini API.", details: geminiData }), { status: 500 });
    }

    const organizedContent = geminiData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ success: true, organizedContent: organizedContent }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error in handleOrganizeLog:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function serveStaticAsset(assetPath, env) {
  const assetRequest = new Request(new URL(assetPath, "http://internal/"));
  return env.ASSETS.fetch(assetRequest);
}

async function handleCurrentRules(env) {
  try {
    const rulesRequest = new Request(new URL("/00_LATEST_CHECKPOINT_READ_FIRST.md", "http://internal/"));
    const rulesResponse = await env.ASSETS.fetch(rulesRequest);
    const rulesText = await rulesResponse.text();

    const antiVerificationLoopRuleRegex = /### ANTI-VERIFICATION-LOOP RULE\n\n([\s\S]*?)\n\n## 📅 Handoff Date:/;
    const match = rulesText.match(antiVerificationLoopRuleRegex);

    if (match && match[1]) {
      return new Response(JSON.stringify({ rule: match[1].trim() }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Anti-Verification-Loop Rule not found in 00_LATEST_CHECKPOINT_READ_FIRST.md" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
