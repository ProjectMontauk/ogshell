#!/usr/bin/env node
/**
 * Whose turn it is. Prints the agent that runs now and the market it researches as env lines,
 * which the workflow (.github/workflows/agents.yml) appends to $GITHUB_ENV for the scripts that follow.
 *
 * Usage:
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/agents.mjs              # whoever is next
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/agents.mjs "Skeptic"    # a named agent
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/agents.mjs --check      # self-test
 */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { AGENT_MARKET_IDS, activeAgents } from "../src/data/agents.ts";

const TURN_HOURS = 4; // keep in step with the cron in .github/workflows/agents.yml

/**
 * Agent and research market for turn number `slot`. Markets go round in order; the agent shifts by one
 * each time round, so every agent gets to every market instead of being paired with one for good.
 */
export function pickTurn(slot, agents, marketIds) {
  return {
    agent: agents[(slot + Math.floor(slot / marketIds.length)) % agents.length],
    marketId: marketIds[slot % marketIds.length],
  };
}

/**
 * Whether `url` came back from the model's web search rather than from the model itself.
 * Looks for it in everything the API returned except the model's own words (text, thinking, tool inputs).
 */
export function isSourced(url, blocks) {
  const needle = url.trim().replace(/\/$/, "");
  if (!/^https?:\/\/\S+$/.test(needle)) return false;
  const returned = blocks
    .filter((b) => b.type !== "tool_use" && b.type !== "thinking")
    .map((b) => (b.type === "text" ? b.citations : b));
  return JSON.stringify(returned).includes(needle);
}

function check() {
  const five = ["a", "b", "c", "d", "e"];
  const pairs = new Set();
  for (let slot = 0; slot < 25; slot++) {
    const { agent, marketId } = pickTurn(slot, five, AGENT_MARKET_IDS);
    pairs.add(`${agent}/${marketId}`);
  }
  assert.equal(pairs.size, 25, "five agents cover every market in 25 turns");
  assert.equal(pickTurn(7, ["solo"], AGENT_MARKET_IDS).agent, "solo");
  assert.equal(pickTurn(7, ["solo"], AGENT_MARKET_IDS).marketId, AGENT_MARKET_IDS[2]);

  const url = "https://example.org/study";
  const searched = [{ type: "web_search_tool_result", content: [{ type: "web_search_result", url }] }];
  assert.equal(isSourced(url, searched), true);
  assert.equal(isSourced(`${url}/`, searched), true);
  assert.equal(isSourced(url, [{ type: "text", text: `see ${url}`, citations: null }]), false, "the model's own text is not a source");
  assert.equal(isSourced(url, [{ type: "text", text: "x", citations: [{ url }] }]), true);
  assert.equal(isSourced(url, [{ type: "tool_use", input: { url } }]), false);
  assert.equal(isSourced("not a url", searched), false);
  console.log("agents ok");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === "--check") {
    check();
  } else {
    const turn = pickTurn(Math.floor(Date.now() / (TURN_HOURS * 3_600_000)), activeAgents, AGENT_MARKET_IDS);
    const agent = arg ? activeAgents.find((a) => a.name.toLowerCase() === arg.toLowerCase()) : turn.agent;
    if (!agent) {
      console.error(`No active agent named "${arg}". Active: ${activeAgents.map((a) => a.name).join(", ")}`);
      process.exit(1);
    }
    console.log(`AGENT_WALLET_ADDRESS=${agent.address}`);
    console.log(`AGENT_RESEARCH_MARKET=${turn.marketId}`);
  }
}
