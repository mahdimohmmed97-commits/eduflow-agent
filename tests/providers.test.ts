import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "@/app/api/agent/route";
import { selectedProvider } from "@/lib/model-provider";
import type { ReminderRequest } from "@/lib/agent";

const reminder: ReminderRequest = {
  kind: "reminders",
  locale: "en",
  teacherName: "Ms. Sara Al Nuaimi",
  schoolLine: "Al Noor International School — Dubai",
  className: "Grade 8 — A",
  subject: "Mathematics",
  assignmentTitle: "Fractions",
  dueDateLabel: "12 November 2026",
  tone: "formal",
  students: [
    {
      id: "stu-01",
      name: "Layla Al Mansoori",
      givenName: "Layla",
      gender: "female",
      parentName: "Fatima Al Mansoori",
      status: "not_submitted",
    },
  ],
};

function saveEnv() {
  return {
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  };
}

function restoreEnv(saved: ReturnType<typeof saveEnv>) {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearProviderEnv() {
  delete process.env.AI_PROVIDER;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
}

async function post() {
  return POST(new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify(reminder) }));
}

test("with no provider and no keys the agent route stays on the local template", async () => {
  const saved = saveEnv();
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  clearProviderEnv();
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return new Response("should not be called", { status: 500 });
  };
  try {
    assert.equal(selectedProvider().provider, "none");
    const response = await post();
    const body = (await response.json()) as { source?: string; sent?: boolean };
    assert.equal(response.status, 200);
    assert.equal(body.source, "template");
    assert.equal(body.sent, undefined);
    assert.equal(calls.length, 0);
  } finally {
    restoreEnv(saved);
    globalThis.fetch = originalFetch;
  }
});

test("AI_PROVIDER=none does not call a model even when both keys are present", async () => {
  const saved = saveEnv();
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  process.env.AI_PROVIDER = "none";
  process.env.OPENAI_API_KEY = "test-openai";
  process.env.ANTHROPIC_API_KEY = "test-anthropic";
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return new Response("should not be called", { status: 500 });
  };
  try {
    const response = await post();
    const body = (await response.json()) as { source?: string };
    assert.equal(body.source, "template");
    assert.equal(calls.length, 0);
  } finally {
    restoreEnv(saved);
    globalThis.fetch = originalFetch;
  }
});

test("openai and anthropic are called only when selected, and unsafe model text stays on the template", async () => {
  const saved = saveEnv();
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    const url = String(input);
    if (url.includes("api.openai.com")) {
      return Response.json({
        choices: [{ message: { content: JSON.stringify({ drafts: [{ studentId: "stu-01", studentMessage: "full marks guaranteed", parentMessage: "full marks guaranteed" }] }) } }],
      });
    }
    return Response.json({
      content: [{ type: "text", text: JSON.stringify({ drafts: [{ studentId: "stu-01", studentMessage: "Layla Al Mansoori still needs to submit Fractions, due 12 November 2026.", parentMessage: "Fatima Al Mansoori, Layla Al Mansoori still needs to submit Fractions, due 12 November 2026." }] }) }],
    });
  };
  try {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-openai";
    delete process.env.ANTHROPIC_API_KEY;
    const openai = await post();
    const openaiBody = (await openai.json()) as { source?: string; drafts?: Array<{ studentMessage: string }> };
    assert.equal(calls.at(-1)?.includes("api.openai.com"), true);
    assert.equal(openaiBody.source, "template");
    assert.equal(openaiBody.drafts?.[0]?.studentMessage.includes("full marks"), false);

    calls.length = 0;
    process.env.AI_PROVIDER = "anthropic";
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-anthropic";
    const anthropic = await post();
    const anthropicBody = (await anthropic.json()) as { source?: string; sent?: boolean; drafts?: Array<{ studentMessage: string; parentMessage: string }> };
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.includes("api.anthropic.com"), true);
    assert.equal(anthropicBody.sent, undefined);
    assert.equal(anthropicBody.source, "anthropic");
    assert.equal(anthropicBody.drafts?.[0]?.studentMessage.includes("Layla Al Mansoori"), true);
    assert.equal(anthropicBody.drafts?.[0]?.parentMessage.includes("full marks"), false);

    calls.length = 0;
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return Response.json({
        content: [{ type: "text", text: JSON.stringify({ drafts: [{ studentId: "stu-01", studentMessage: "full marks guaranteed", parentMessage: "Call +971500000000 now." }] }) }],
      });
    };
    const blocked = await post();
    const blockedBody = (await blocked.json()) as { source?: string; drafts?: Array<{ studentMessage: string; parentMessage: string }> };
    assert.equal(calls[0]?.includes("api.anthropic.com"), true);
    assert.equal(blockedBody.source, "template");
    assert.equal(blockedBody.drafts?.[0]?.studentMessage.includes("full marks"), false);
    assert.equal(blockedBody.drafts?.[0]?.parentMessage.includes("+971"), false);
  } finally {
    restoreEnv(saved);
    globalThis.fetch = originalFetch;
  }
});
