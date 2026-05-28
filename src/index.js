// Force redeploy at 2026-05-28 07:00 UTC
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path === "/api/latest") {
      const bossRequest = new Request(new URL("/00_LATEST_CHECKPOINT_READ_FIRST.md", "http://internal/"));
      const bossResponse = await env.ASSETS.fetch(bossRequest);
      const content = await bossResponse.text();

      return new Response(JSON.stringify({
        sourceOfTruth: "public/00_LATEST_CHECKPOINT_READ_FIRST.md",
        canonicalRule: "This file is the canonical source of truth. If another route, log, checkpoint, or generated summary conflicts with this file, this file wins.",
        content
      }, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      });
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
  },
  async scheduled(controller, env, ctx) {
    console.log(`[ScheduledConsolidate] Triggered by cron: ${controller.cron}`);

    const token = env.UPDATE_TOKEN;
    if (!token) {
      console.error("[ScheduledConsolidate] UPDATE_TOKEN is not set. Cannot run consolidation.");
      return;
    }

    // Simulate a request object for handleConsolidate
    const mockRequest = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }),
      json: async () => ({ token: token }) // Provide a mock json body
    };

    try {
      const result = await handleConsolidateInternal(env);

      if (result.success) {
        console.log(`[ScheduledConsolidate] Consolidation successful:`, result);
      } else {
        console.error(`[ScheduledConsolidate] Consolidation failed:`, result);
      }
    } catch (e) {
      console.error(`[ScheduledConsolidate] Error during scheduled consolidation:`, e);
    }
  },
};

async function handleLatest(env) {
  try {
    const rulesRequest = new Request(new URL("/00_LATEST_CHECKPOINT_READ_FIRST.md", "http://internal/"));
    const rulesResponse = await env.ASSETS.fetch(rulesRequest);
    const rulesText = await rulesResponse.text();

    return new Response(rulesText, {
      headers: { "Content-Type": "text/markdown" }
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
  const body = await request.json();

  // Basic abuse protection for public submissions
  if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Content field is required and cannot be empty." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    let { title, content, tags, source_chat, confidence_level } = body;
    // Ensure type is 'collected_log' for this endpoint
    const type = 'collected_log';
    const supersedes_previous = false; // Collected logs don't supersede by default
    let newTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    if (!newTags.includes('public-submission')) {
      newTags.push('public-submission');
    }
    tags = newTags.join(',');

    const { lastRowId } = await env.DB.prepare(`
      INSERT INTO handoff_entries (type, title, content, tags, source_chat, confidence_level, supersedes_previous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      type,
      title || null,
      content,
      tags || null, // Use the modified tags
      source_chat || null,
      confidence_level || null,
      supersedes_previous ? 1 : 0
    ).run();

    let finalContent = content;

    // Auto-organize if GEMINI_API_KEY is available
    if (env.GEMINI_API_KEY) {
      try {
        const organizedResponse = await handleOrganizeLogInternal({ content: content }, env);
        if (organizedResponse.success) {
          finalContent = organizedResponse.organizedContent;
          await env.DB.prepare(`
            UPDATE handoff_entries
            SET content = ?
            WHERE id = ?
          `).bind(finalContent, lastRowId).run();
        } else {
          console.error("Auto-organization failed:", organizedResponse.error);
        }
      } catch (e) {
        console.error("Error during auto-organization:", e);
      }
    }

    // Automatically trigger consolidation
    const consolidationResult = await handleConsolidateInternal(env);

    return new Response(JSON.stringify({
      success: true,
      id: lastRowId,
      organized: !!env.GEMINI_API_KEY,
      consolidation: consolidationResult
    }), {
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

async function handleConsolidateInternal(env) {
  try {
    // Select only unprocessed collected logs
    const { results: collectedLogs } = await env.DB.prepare(`
      SELECT id, content FROM handoff_entries
      WHERE type = 'collected_log'
      ORDER BY created_at ASC
    `).all();

    if (collectedLogs.length === 0) {
      return { success: true, message: "No new collected logs to consolidate." };
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
      0 // supersedes_previous (no longer supersedes the main source of truth)
    ).run();

    // Delete processed logs
    const collectedLogIds = collectedLogs.map(log => log.id);
    if (collectedLogIds.length > 0) {
        const placeholders = collectedLogIds.map(() => '?').join(', ');
        await env.DB.prepare(`
            DELETE FROM handoff_entries
            WHERE id IN (${placeholders})
        `).bind(...collectedLogIds).run();
    }

    return { success: true, checkpointId: lastRowId, message: "Logs consolidated into a new checkpoint." };
  } catch (e) {
    console.error("Consolidation error:", e);
    return { success: false, error: e.message };
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

  const result = await handleConsolidateInternal(env);

  if (result.success) {
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  } else {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Internal helper to call handleOrganizeLog without re-authenticating
async function handleOrganizeLogInternal(body, env) {
  const geminiApiKey = env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return { success: false, error: "GEMINI_API_KEY is not set." };
  }

  const { content: rawLogContent } = body;
  if (!rawLogContent) {
    return { success: false, error: "Missing 'content' in request body." };
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
    return { success: false, error: "Failed to get organized content from Gemini API.", details: geminiData };
  }

  const organizedContent = geminiData.candidates[0].content.parts[0].text;
  return { success: true, organizedContent: organizedContent };
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

  const result = await handleOrganizeLogInternal(body, env);
  if (result.success) {
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  } else {
    return new Response(JSON.stringify(result), { status: 500 });
  }
}

async function serveStaticAsset(assetPath, env) {
  const assetRequest = new Request(new URL(assetPath, "http://internal/"));
  return env.ASSETS.fetch(assetRequest);
}

async function handleCurrentRules(request, env, ctx) {
  const bossRequest = new Request(new URL("/00_LATEST_CHECKPOINT_READ_FIRST.md", "http://internal/"));
  const bossResponse = await env.ASSETS.fetch(bossRequest);
  const content = await bossResponse.text();

  return new Response(JSON.stringify({
    sourceOfTruth: "public/00_LATEST_CHECKPOINT_READ_FIRST.md",
    canonicalRule: "This file is the canonical source of truth. If another route, log, checkpoint, or generated summary conflicts with this file, this file wins.",
    content
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
