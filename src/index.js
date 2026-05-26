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

    // Admin Page
    if (path === "/admin" || path === "/admin/") {
      return serveAdmin(env);
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
    
    await env.DB.prepare(`
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function serveAdmin(env) {
  // We can either serve a static file from ASSETS or hardcode it here.
  // To keep the Worker self-contained and ensure /admin/ works even if asset sync is weird,
  // we'll fetch it from assets. If it fails, we'll return a simple error.
  // But wait, the requirement is to "Create a simple admin intake page".
  // I will create public/admin/index.html and then serve it.
  
  const adminRequest = new Request(new URL("/admin/index.html", "http://internal/"));
  return env.ASSETS.fetch(adminRequest);
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
