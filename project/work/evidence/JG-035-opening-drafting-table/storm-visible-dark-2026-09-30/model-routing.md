# Model routing evidence

Parent: visual direction, phase envelope, ambient paper/desk lighting, initial glyph-lighting shader and final integration review. Supporting file ownership is recorded in the execution plan.

GLM-5.3 native subagent assignments: verifier/contract, documentation, and fresh technical review. Proxy records include `requestedModel=zai/glm-5.3`, `resolvedModel=glm-5.3`, `servedModel=glm-5.3`, provider `zai`, status 200. Example request `ocx-24c538446a325881b1e6c0f308a3e650` is a proxy attribution record, not a separately captured upstream receipt.

GLM-5.3 Flash supporting tests used local `codex exec -m zai/glm-5.3-flash` because the native subagent selector lacks Flash. Proxy attribution examples: `ocx-7fb2002c233c8174ab28e7c614962c9b`, `ocx-7cef4938d060d504c07c75f9b2635cb4`, and `ocx-c14246c97b74c1727ae612e173f7d21b`; requested `zai/glm-5.3-flash`, resolved/served `glm-5.3-flash`, status 200. CLI events/results live in ignored `.scratch/`.

DeepSeek capture/pixel tools used available native selector `openrouter/~deepseek-deepseek-flash-latest`. Proxy records prove the requested OpenRouter route and status 200, but omit resolved/served fields. Actual upstream model attribution is **unproven**; do not convert the requested alias into served-model proof. Examples: `ocx-b731af7065e9d6ee790dd0017e7d2962`, `ocx-9462240cb0ed6bafc4ecc5b8941c5b9b`. Parent independently reviews and runs the deliverable regardless of attribution.

A recent proxy-history search showed one DeepSeek 429; parent explicitly nudged the assignment to resume. Worker reports no rate-limit error in its own commands. Later observed requests returned 200 and no repeated rate-limit condition was observed for this assignment. If repetition occurs, remaining work routes to GLM for this session.

The requested orchestration advisor procedure was dispatched via local `codex exec -m anthropic/claude-fable-5-1`. It exhausted retries with 429 and produced no review. Parent reported the failure and routed a fresh-context review to GLM-5.3. This is a fallback review, not a Fable verdict.

All worker reports are claims until checked by the parent. The evidence report records parent reruns, rejected outputs and resolved findings separately.
