import test from "node:test";
import assert from "node:assert/strict";
import { intentID, newIntentID, openIntents } from "../src/timeline.js";

test("openIntents folds resolved intents out of the active queue", () => {
  const first = {
    at: "2026-07-07T00:00:00.000Z",
    type: "intent",
    actor: "agent:codex",
    action: "install pnpm",
    target: "pnpm",
    status: "open"
  };
  first.id = intentID(first);
  const second = {
    at: "2026-07-07T00:01:00.000Z",
    type: "intent",
    actor: "agent:claude",
    action: "check docker",
    target: "docker",
    status: "open"
  };
  second.id = intentID(second);

  const open = openIntents([
    first,
    second,
    {
      at: "2026-07-07T00:02:00.000Z",
      type: "intent-resolved",
      actor: "human:you",
      ref: first.id,
      status: "resolved"
    }
  ]);

  assert.deepEqual(open.map((intent) => intent.id), [second.id]);
});

test("newIntentID returns a short intent id", () => {
  const id = newIntentID(new Date("2026-07-07T00:00:00.000Z"));
  assert.match(id, /^int_[a-z0-9]+_[a-z0-9]{6}$/);
});
