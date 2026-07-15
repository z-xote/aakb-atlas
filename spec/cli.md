# OPENCLAW CLI TOOL TEMPLATE

**Purpose:** This document is the canonical reference for building new CLI tools in the openclaw ecosystem. Pass it alongside any new tool request so Claude can replicate the exact architecture, patterns, and conventions established by `openclaw-taskboard-cli`.

---

## 1. What This Pattern Produces

Every openclaw CLI tool built using this template produces:

- **A single compiled binary** — one file, no Node/Bun runtime required on the target machine
- **A config & secrets layer** persisted in `~/.config/<toolname>/config.json` — separate from the binary, fully user-controlled
- **A flag system** with three-tier defaults (hardcoded → config file → CLI override)
- **Dual output modes** — plain text by default (agent-safe), ANSI colour via `--pretty` (humans only)
- **Tiered view presets** (`--view mini|standard|full`) to control output verbosity and token cost
- **stderr for diagnostics, stdout for data** — machine-parseable by default

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Bun** | Native TypeScript, fast startup, `--compile` to single binary |
| Language | **TypeScript** (strict) | Type safety, autocomplete, explicit enum contracts |
| DB client | **mongodb** (official driver) | Direct wire-protocol access — no HTTP, no ORM |
| Build | `bun build --compile` | Produces a self-contained binary with Bun runtime embedded |

### package.json template

```json
{
  "name": "openclaw-<toolname>-cli",
  "version": "0.1.0",
  "description": "Terminal CLI for openclaw <toolname> — direct MongoDB access, zero HTTP",
  "type": "module",
  "bin": {
    "<toolname>": "./src/index.ts"
  },
  "scripts": {
    "dev":   "bun src/index.ts",
    "build": "bun build --compile --target=bun --outfile=<toolname> src/index.ts"
  },
  "dependencies": {
    "mongodb": "^6.x"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "bun-types":  "latest"
  }
}
```

### tsconfig.json template

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*"]
}
```

---

## 3. Project Structure

```
openclaw-<toolname>-cli/
├── src/
│   ├── index.ts          ← entry point: arg parsing, routing, help text
│   ├── types.ts          ← all TypeScript types, enums, and const arrays
│   ├── flags.ts          ← parseFlags() — the three-tier flag resolver
│   ├── config.ts         ← ~/.config/<toolname>/config.json read/write
│   ├── db.ts             ← MongoDB singleton + credential resolution
│   ├── render.ts         ← all output formatting, ANSI C object, table renderer
│   ├── utils.ts          ← shared helpers: ID resolution, time formatting, activity logging
│   └── commands/
│       ├── get.ts
│       ├── create.ts
│       ├── edit.ts
│       ├── status.ts
│       ├── search.ts
│       ├── note.ts
│       ├── activity.ts
│       ├── debug.ts
│       └── config.ts
├── .env                  ← LOCAL DEV ONLY — never committed, never read by binary
├── .env.example          ← documents available env vars
├── AGENT_PROMPT.md       ← compact one-paragraph prompt for injecting into AI context
├── README.md             ← agent-focused command reference (tables, not prose)
├── package.json
├── tsconfig.json
└── <toolname>            ← the compiled binary (gitignored or versioned separately)
```

---

## 4. The Singular Binary Output

### Build command

```bash
bun build --compile --target=bun --outfile=<toolname> src/index.ts
```

This embeds the Bun runtime, all TypeScript source, and all npm dependencies into a single native binary. The result:

- Zero install friction — copy the binary anywhere (`/usr/local/bin`, `~/bin`) and it works
- No `node_modules/` on the target machine
- No Bun installation required on the target machine
- Fast cold-start (sub-100ms typical)

### Shebang for dev mode

`src/index.ts` must begin with:

```ts
#!/usr/bin/env bun
```

This allows `bun src/index.ts` to work directly in development without a compilation step.

### Entrypoint pattern

```ts
#!/usr/bin/env bun
import { parseFlags } from "./flags.js";

const argv  = process.argv.slice(2);
const flags = parseFlags(argv);

setPretty(flags.pretty);

try {
  switch (flags.command) {
    case "get":    await cmdGet(flags);    break;
    case "create": await cmdCreate(flags); break;
    // ...
    default:
      printHelp();
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`${C.red}✗${C.reset} ${msg}\n`);
  process.exit(1);
} finally {
  await closeDb();  // always clean up DB connection
}
```

---

## 5. The Config & Secrets Layer

### How it works

The binary stores its configuration (including secrets like MongoDB URI) in a JSON file at:

```
~/.config/<toolname>/config.json
```

This path is resolved at runtime using `os.homedir()`, which means:

- The binary can be placed **anywhere** — `/usr/local/bin`, `~/bin`, a symlink — and it will always find its config
- The config is **not relative to any working directory** or install path
- The `.env` file is only ever loaded in `dev` mode (`bun src/index.ts`) — the compiled binary ignores it entirely

### src/config.ts pattern

```ts
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";

export const CONFIG_DIR  = join(homedir(), ".config", "<toolname>");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface Config {
  mongoUri?:      string;   // connection string — stored once, never re-entered
  dbName?:        string;   // optional DB name override
  defaultView?:   View;     // output column preset
  defaultPretty?: boolean;  // ANSI colour (false = agent-safe)
  defaultLimit?:  number;   // max results per query
  defaultPanel?:  string;   // auto-scope to this panel/namespace
  // ... add tool-specific persistent preferences here
}

export const CONFIG_KEYS = [
  "mongo-uri", "db-name", "view", "pretty", "limit", "panel",
] as const;

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as Config;
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
```

### First-run setup UX

```bash
<toolname> config set mongo-uri "mongodb+srv://..."
<toolname> config set view mini          # AI sessions prefer mini
<toolname> config set pretty true        # human terminal sessions only
<toolname> debug                         # verify connection
```

The `config` command always provides `set`, `unset`, `reset`, and `show` subcommands with the exact set of keys exposed in `CONFIG_KEYS`.

### Secrets redaction in output

When displaying the config (via `<toolname> config show`), always redact the MongoDB URI. The `debug` command uses a slightly more informative variant that preserves the username but masks the password:

```ts
// config show — host only
function redact(uri: string): string {
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.host}/***`;
  } catch {
    return "*** (set)";
  }
}

// debug command — preserves username, masks password
function redactUri(uri: string): string {
  try {
    const u = new URL(uri);
    const user = u.username ? u.username : "???";
    return `${u.protocol}//${user}:***@${u.host}${u.pathname}`;
  } catch {
    return "(unparseable URI)";
  }
}
```

### Source transparency in config show

`config show` must display not just whether `mongo-uri` is set, but **which source** the active URI comes from and what will actually be used at runtime:

```ts
const envUri    = process.env.MONGO_URI;
const cfgUri    = cfg.mongoUri;
const activeUri = cfgUri ?? envUri;        // config file wins
const uriSource = cfgUri ? "config file"
                : envUri ? "shell env $MONGO_URI"
                : null;

const uriDisplay = activeUri
  ? `${redact(activeUri)}  [source: ${uriSource}]`
  : "(not set — run: <toolname> config set mongo-uri \"...\")";
```

This makes credential debugging self-service — users can immediately see if an env var is being ignored because the config file is taking priority.
```

---

## 6. The Three-Tier Flag Resolution System

This is the core of the flag system. Every flag that has a sensible persistent default follows this priority chain (lowest to highest):

```
1. Built-in hardcoded default   (e.g. view = "standard", limit = 20, pretty = false)
2. ~/.config/<toolname>/config.json  (set once via `<toolname> config set`)
3. CLI flag passed at runtime   (always wins)
```

### src/flags.ts pattern

```ts
import { loadConfig } from "./config.js";

export function parseFlags(argv: string[]): ParsedFlags {
  const cfg = loadConfig();  // seed from config file first

  const [command = "help", ...rest] = argv;

  const flags: ParsedFlags = {
    command,
    args:   [],
    tags:   [],
    // Config-aware defaults — CLI flags can still override
    view:   cfg.defaultView   ?? "standard",
    limit:  cfg.defaultLimit  ?? 20,
    pretty: cfg.defaultPretty ?? false,
    panel:  cfg.defaultPanel,
    // ... tool-specific fields
  };

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]!;

    if (!token.startsWith("--")) {
      flags.args.push(token);  // positional arg
      continue;
    }

    // Support both:  --key value   AND   --key=value
    const eqIdx = token.indexOf("=");
    let key: string;
    let val: string | undefined;

    if (eqIdx !== -1) {
      key = token.slice(2, eqIdx);
      val = token.slice(eqIdx + 1);
    } else {
      key = token.slice(2);
      const peek = rest[i + 1];
      if (peek !== undefined && !peek.startsWith("--")) {
        val = peek;
        i++;
      }
    }

    switch (key) {
      case "pretty":     flags.pretty = true;  break;
      case "no-pretty":  flags.pretty = false; break;
      case "view":
        if (val && isView(val)) flags.view = val;
        else if (val) console.error(`⚠ Invalid view "${val}"`);
        break;
      // ... all other flags
    }
  }

  return flags;
}
```

### Flag syntax supported

| Syntax | Example | Notes |
|---|---|---|
| `--key value` | `--panel xote` | Space-separated |
| `--key=value` | `--panel=xote` | Equals-sign |
| `--boolean` | `--blocked` | No value → true |
| `--no-boolean` | `--no-pretty` | Explicit false override |
| Repeatable | `--tag bug --tag auth` | Append to array |
| Hyphenated aliases | `--view-mini` | Convenience shorthand for enum values |

---

## 7. The --pretty Flag: AI-Safe Output by Default

This is the most important design decision for openclaw tool use.

### The rule

**`--pretty` is OFF by default.** Plain text output is the default. ANSI escape codes are never emitted unless the user (or their config) explicitly enables `--pretty`.

### Why this matters for AI / openclaw

When an AI like openclaw reads CLI output, ANSI escape codes appear as literal characters in the context window:

```
\x1b[1m\x1b[36mID\x1b[0m  \x1b[1mTITLE\x1b[0m ...
```

This wastes tokens, pollutes the AI's context, and makes parsing harder. Plain text output uses the full context window for actual data, not formatting noise.

### Implementation: the C (colour) object

```ts
// src/render.ts

let _pretty = false;

export function setPretty(enabled: boolean): void {
  _pretty = enabled;
}

// Lazy getter — returns empty string when pretty is off
const _a = (code: string): string => (_pretty ? code : "");

export const C = {
  get reset()   { return _a("\x1b[0m"); },
  get bold()    { return _a("\x1b[1m"); },
  get dim()     { return _a("\x1b[2m"); },
  get red()     { return _a("\x1b[31m"); },
  get green()   { return _a("\x1b[32m"); },
  get yellow()  { return _a("\x1b[33m"); },
  get blue()    { return _a("\x1b[34m"); },
  get magenta() { return _a("\x1b[35m"); },
  get cyan()    { return _a("\x1b[36m"); },
  get white()   { return _a("\x1b[37m"); },
  get gray()    { return _a("\x1b[90m"); },
};
```

All formatting in the codebase uses `C.bold`, `C.cyan`, etc. — never raw escape strings. When `_pretty = false`, every `C.*` getter returns `""`, so the ANSI codes simply vanish from output with zero branching in the render functions themselves.

### Visual length accounting

When `--pretty` is on, ANSI codes add invisible characters to strings that break column alignment. The render module strips them before measuring:

```ts
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

export function visLen(s: string): number {
  return stripAnsi(s).length;
}
```

Use `visLen` (not `.length`) whenever computing column widths for tabular output.

### Config persistence

```bash
<toolname> config set pretty true    # enable for human sessions
<toolname> config set pretty false   # restore agent-safe default
```

Per-call override:

```bash
<toolname> get --pretty             # force on for this call
<toolname> get --no-pretty          # force off even if config says true
```

---

## 8. The --view Flag: Token Budget Control

The `--view` flag controls which columns appear in table output. This directly controls how many tokens a query consumes in the AI's context window.

### Standard view presets

| View | Columns | When to use |
|---|---|---|
| `mini` | id · title · status · priority | Default for AI sessions — minimal tokens |
| `standard` | + panel · section · tags · blocked · due | When those fields are needed |
| `full` | All fields + description (vertical card per task) | Only when description or timestamps needed |

### AI guidance

AI sessions should **always default to `--view mini`** and only escalate when the task specifically requires additional fields. The `AGENT_PROMPT.md` file enforces this.

### Implementation

```ts
export function renderTasks(tasks: Task[], view: View): string {
  if (view === "full")     return tasks.map(renderFullCard).join("\n");
  if (view === "mini")     return renderTable(["ID","TITLE","STATUS","PRIORITY"], tasks.map(taskToMini));
  /* standard */           return renderTable(["ID","TITLE","STATUS","PRIORITY","PANEL","SECTION","TAGS","BLOCKED","DUE"], tasks.map(taskToStandard));
}
```

---

## 9. Stdout vs Stderr: The Output Contract

This is enforced everywhere in the codebase:

| Channel | Content |
|---|---|
| **stdout** | All data output: tables, task cards, write confirmations, created IDs |
| **stderr** | Diagnostics only: `--verbose` headers, connection errors during startup |

The rationale: an AI piping the CLI into a variable (e.g. `result=$(taskboard get --view mini)`) should get clean data on stdout. Verbose diagnostic banners never pollute the data pipe.

```ts
// Diagnostic — goes to stderr
process.stderr.write(`── verbose ──────────\nfilter: ${JSON.stringify(filter)}\n`);

// Data — goes to stdout
process.stdout.write(renderTasks(tasks, flags.view));
```

---

## 10. The MongoDB Connection Layer

### src/db.ts: three-tier credential resolution

```
Priority:
  1. ~/.config/<toolname>/config.json    ← highest (set once via `<toolname> config set`)
  2. Shell env vars MONGO_URI / DB_NAME  ← fallback when config is absent
  3. Hardcoded fallback for DB_NAME only
```

The config file wins. This ensures that a `taskboard config set mongo-uri "..."` always takes effect regardless of what shell environment variables happen to be set in the session. Env vars exist as a fallback only — useful when the config file hasn't been set up yet or for one-off overrides in environments where writing to `~/.config/` isn't practical.

```ts
function resolveCredentials(): { uri: string | undefined; dbName: string } {
  const cfg    = loadConfig();
  const uri    = cfg.mongoUri ?? process.env.MONGO_URI;
  const dbName = cfg.dbName   ?? process.env.DB_NAME ?? "<default-db-name>";
  return { uri, dbName };
}
```

If `uri` is not found (neither env nor config), the binary prints a clear error with the exact config command to fix it, then exits with code 1.

### Singleton pattern

```ts
let _client:     MongoClient | null = null;
let _collection: Collection<T> | null = null;

export async function getDb(): Promise<DbHandle> {
  if (_collection) return { collection: _collection };  // reuse if already connected

  const { uri, dbName } = resolveCredentials();
  if (!uri) { /* print error + exit 1 */ }

  _client = new MongoClient(uri);
  await _client.connect();
  const db = _client.db(dbName);
  _collection = db.collection<T>("<collection-name>");

  return { collection: _collection };
}

export async function closeDb(): Promise<void> {
  if (_client) {
    await _client.close();
    _client = _collection = null;
  }
}
```

`closeDb()` is always called in the `finally` block of `index.ts` — it is a no-op if the DB was never opened (e.g. `config show` command never connects).

---

## 11. Types System

All enums are defined as both TypeScript types AND `const` readonly arrays. The arrays are used for runtime validation in `flags.ts`:

```ts
// src/types.ts

export type Status   = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high" | "critical";
export type View     = "mini" | "standard" | "full";

// Runtime-accessible arrays — used for validation and error messages
export const STATUSES:   readonly Status[]   = ["todo", "in_progress", "done"];
export const PRIORITIES: readonly Priority[] = ["low", "medium", "high", "critical"];
export const VIEWS:      readonly View[]     = ["mini", "standard", "full"];

// Validation helpers in flags.ts
function isStatus(v: string): v is Status { return (STATUSES as readonly string[]).includes(v); }
```

This pattern ensures that when a user passes an invalid enum value, the error message automatically lists all valid options:

```ts
if (val && !isStatus(val))
  console.error(`⚠ Invalid status "${val}". Valid: ${STATUSES.join(" | ")}`);
```

### ParsedFlags interface

The `ParsedFlags` interface is the single object that flows from `parseFlags()` through the router and into every command. It holds all routing info, filter state, output control, and write field values:

```ts
export interface ParsedFlags {
  command:      string;
  args:         string[];  // positional args after the command token

  // read filters
  panel?:       string;
  status?:      Status;
  priority?:    Priority;
  tags:         string[];  // --tag is repeatable
  section?:     string;
  blocked?:     boolean;
  overdue:      boolean;
  includeDone:  boolean;

  // output control
  view:         View;
  limit:        number;
  verbose:      boolean;
  pretty:       boolean;  // ANSI — off by default (agent-safe)

  // write flags
  title?:       string;
  desc?:        string;
  due?:         string;
  reason?:      string;
  note?:        string;
  // ... add tool-specific write flags here
}
```

---

## 12. Command Implementation Pattern

Every command follows this exact structure:

```ts
// src/commands/<command>.ts

import type { ParsedFlags } from "../types.js";
import { getDb } from "../db.js";
import { renderError, renderDiff, shortId } from "../render.js";

export async function cmd<Command>(flags: ParsedFlags): Promise<void> {
  // 1. Validate required args/flags up front — fail fast, print usage hint
  const [taskInput] = flags.args;
  if (!taskInput) {
    process.stdout.write(renderError("usage: <toolname> <command> <id> [--flag]"));
    return;
  }

  // 2. Connect to DB (singleton — only opens once per process)
  const { collection, activity } = await getDb();

  // 3. Resolve flexible IDs (8-char prefix or full 24-char ObjectId)
  const id = await resolveTaskId(taskInput, collection);
  if (!id) {
    process.stdout.write(renderError(`record not found [${taskInput}]`));
    return;
  }

  // 4. Fetch current state (needed for diffs and activity log)
  const record = await collection.findOne({ _id: id });
  if (!record) {
    process.stdout.write(renderError(`record not found [${taskInput}]`));
    return;
  }

  // 5. Apply changes
  await collection.updateOne({ _id: id }, { $set: { field: newValue, updatedAt: new Date() } });

  // 6. Log activity
  await logActivity(id, record.panel, "updated",
    { field: "fieldName", oldValue: record.field, newValue, triggered_by: "ai" },
    activity
  );

  // 7. Output diff confirmation to stdout
  process.stdout.write(renderDiff("label", shortId(id), [
    { field: "fieldName", from: record.field, to: newValue }
  ]));
}
```

### Key conventions

- **Fail fast** — validate all required args before opening the DB connection
- **Diffs** — write commands always show `field: old → new` on success, never just "OK"
- **triggered_by: "ai"** — all programmatic writes log the actor as `"ai"` in the activity collection
- **Never `console.log()`** — always use `process.stdout.write()` for precise newline control

---

## 13. Short IDs: 8-Char Table Output, Flexible Write Input

Tables show the first 8 characters of the MongoDB ObjectId (`a1b2c3d4`). This is enough to visually identify a record in a small-to-medium dataset and is far less noisy for AI context than a full 24-char string.

Write commands accept **both** formats:

```ts
// src/utils.ts

export async function resolveTaskId(
  input: string,
  col: Collection<Task>
): Promise<ObjectId | null> {
  // Full 24-char ObjectId
  if (input.length === 24) {
    try { return new ObjectId(input); } catch { return null; }
  }

  // 8-char prefix — scan all IDs (acceptable at taskboard scale)
  const docs  = await col.find({}, { projection: { _id: 1 } }).toArray();
  const match = docs.find(d => d._id.toString().startsWith(input));
  return match?._id ?? null;
}
```

The `create` command always prints the full 24-char ID on a second confirmation line so the AI can reference it in subsequent calls without needing to do a prefix lookup.

---

## 14. The Activity Log Pattern

Every write command calls `logActivity()` after mutating data. This creates an auditable trail of every change, including who triggered it.

```ts
// src/utils.ts

export async function logActivity(
  taskId:    ObjectId,
  panel:     string,
  action:    ActionType,    // "created" | "updated" | "completed" | "deleted" | "note"
  extras: {
    field?:        string;
    oldValue?:     unknown;
    newValue?:     unknown;
    note?:         string;
    triggered_by?: Actor;  // "user" | "ai"
  },
  col: Collection<Activity>
): Promise<void> {
  await col.insertOne({
    taskId,
    panel,
    action,
    field:        extras.field        ?? null,
    oldValue:     extras.oldValue     ?? null,
    newValue:     extras.newValue     ?? null,
    note:         extras.note         ?? null,
    triggered_by: extras.triggered_by ?? "ai",
    createdAt:    new Date(),
  });
}
```

**Invariant:** All CLI-triggered changes default to `triggered_by: "ai"`. If a future UI or user-facing action is built, it passes `triggered_by: "user"`. This gives the activity log a clean audit trail.

---

## 15. The Render Module

All output formatting lives in `src/render.ts`. Commands never format strings inline — they call render functions and write the result to stdout.

### ASCII table renderer

```ts
function renderTable(headers: string[], rows: string[][]): string {
  // Calculate visual column widths (honours ANSI escape stripping)
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => visLen(r[i] ?? "")))
  );

  const fmtLine = (cells: string[], isHeader = false): string => {
    const parts = cells.map((cell, i) => {
      const content = isHeader ? C.bold + cell + C.reset : cell;
      return pad(content, widths[i]! + (isHeader ? C.bold.length + C.reset.length : 0));
    });
    return "  " + parts.join("  ");
  };

  const sep = "  " + widths.map(w => "─".repeat(w)).join("  ");

  return [fmtLine(headers, true), sep, ...rows.map(r => fmtLine(r)), ""].join("\n");
}
```

### Standard render function signatures to implement

```ts
renderTasks(tasks: Task[], view: View): string
renderDiff(label: string, id: string, changes: Array<{field: string; from: unknown; to: unknown}>): string
renderCreated(id: string, title: string, panel: string): string
renderNote(id: string, note: string): string
renderActivity(records: Activity[]): string
renderError(msg: string): string    // ✗ prefixed
renderInfo(msg: string): string     // ℹ prefixed
renderCount(n: number, label?: string): string
```

---

## 16. The Debug Command

Every tool must include a `debug` command. It operates in two modes controlled by the `--verbose` flag. The command signature takes `flags: ParsedFlags` so it can read `flags.verbose`.

### Default mode (`taskboard debug`)

Always runs first on setup and whenever something seems wrong. Shows:

- Path to the config file
- Whether `mongo-uri` is set in the config file (redacted)
- Whether `$MONGO_URI` env var is set and whether it is active or being ignored (because config file takes priority)
- Which URI is **actually active** and which source it came from
- Live DB connection confirmation: DB name, collection names, document counts

If no URI is found at all, it exits here with a clear error message and the exact `config set` command to fix it.

### Verbose mode (`taskboard debug --verbose`)

Everything in default mode, plus:

- Value distribution of key enum fields (status, priority, panel, etc.) — reveals data vs expectation mismatches
- All indexes on the primary collection — exposes missing text indexes
- First raw document (no filter) — shows actual field names and value types

### Why two modes

Default mode is fast and low-noise — useful for daily "is the connection healthy?" checks without spamming the output with aggregation data. `--verbose` is the deep-dive for diagnosing zero-results queries or schema mismatches.

### Implementation note

The debug command must show credential source transparency — i.e. it must tell you not just what the active URI is, but **where it came from** (config file vs env var). This is critical for diagnosing priority confusion when both sources are set.

---

## 17. The AGENT_PROMPT.md Contract

Every tool ships an `AGENT_PROMPT.md` file — a compact, single-paragraph prompt injected into the AI's context window alongside any session that will use the tool. It must be:

- **Under 15 lines** — minimal token cost
- **Complete enough** that the AI knows every command signature
- **Explicit about defaults** — especially `--view mini` preference and `--pretty` prohibition

### Template

```markdown
You have access to `<toolname>` — a terminal CLI for [description]. Output is plain text by default (no ANSI escape codes). Always prefer `--view mini` to keep output lean; only escalate to `--view standard` or `--view full` when you need [additional fields]. [Describe any default hiding behaviour, e.g. "Done tasks are hidden by default"]. Never pass `--pretty` — that flag is for human terminal sessions only.

**Read:** `<toolname> get [--panel <name>] [--status <...>] [--view mini]` · `<toolname> search "<query>" [--panel <name>]`

**Write:** `<toolname> create --title "..." --panel "..." [--priority] [--tag]` · `<toolname> status <id> <status>` · `<toolname> edit <id> [--title] [--priority]`

**IDs:** table output shows an 8-char short ID (e.g. `a1b2c3d4`) — use it directly in write commands. `<toolname> create` always prints the full 24-char ID on confirmation.

**Defaults:** panel=all · status excludes done · view=standard · limit=20. Filter to the narrowest scope possible before acting on any record.
```

---

## 18. Help Text Pattern

The `printHelp()` function in `index.ts` is the human-readable reference. Structure it consistently:

```
<toolname>  v0.x.x — openclaw <description>

USAGE
  <toolname> <command> [args] [flags]

READ COMMANDS
  get                          List records  (filters below)
  search  <query>              Full-text search
  activity [id]                Activity log

WRITE COMMANDS
  create   --title --panel     Create a record
  status   <id> <status>       Update status
  edit     <id> [flags]        Edit fields

CONFIG COMMAND
  config                       Show current preferences
  config set <key> <value>     Set a preference
  config unset <key>           Clear a preference
  config reset                 Clear all preferences

  Keys: mongo-uri | db-name | view | pretty | limit | panel

FILTER FLAGS  (get / search)
  --panel    <name>
  --status   <todo|in_progress|done>
  --priority <low|medium|high|critical>
  --tag      <name>            Repeatable: --tag a --tag b
  --blocked                    Only blocked records
  --overdue                    Past due_date, not done
  --include-done               Show done records
  --limit    <n>               Max results
  --verbose                    Print filter, counts, index info to stderr

OUTPUT FLAGS
  --view     <mini|standard|full>   Column preset  (default from config)
  --pretty                          Enable ANSI colours  (human only)
  --no-pretty                       Force plain text

FIRST-RUN SETUP
  <toolname> config set mongo-uri "mongodb+srv://..."
  <toolname> config set view mini
  <toolname> debug                  # verify connection

EXAMPLES
  <toolname> get --panel <name> --priority critical
  <toolname> get --blocked --view mini
  <toolname> search "keyword" --panel <name>
  <toolname> create --title "Fix X" --panel <name> --priority high --tag bug
  <toolname> status a1b2c3d4 in_progress
```

---

## 19. Done-Hidden-by-Default Pattern

Tasks/records with `status: "done"` are hidden from all list and search commands by default. This is intentional:

- Reduces noise in AI context
- Keeps output focused on actionable work
- Mirrors kanban "done = archive" semantics

Implementation in every read command:

```ts
if (flags.status) {
  filter.status = flags.status;           // explicit status overrides the default
} else if (!flags.includeDone) {
  filter.status = { $ne: "done" };        // hide done by default
}
```

Override when needed: `--include-done` or `--status done`.

---

## 20. Verbose Flag Pattern

`--verbose` writes diagnostic headers to **stderr** before the query runs. It shows the raw filter object, document count, index info, and anything else useful for debugging a zero-results query.

```ts
if (flags.verbose) {
  const total    = await collection.countDocuments({});
  const filtered = await collection.countDocuments(filter);

  process.stderr.write(
    `\n── verbose ────────────────────────────────────\n` +
    `filter     ${JSON.stringify(filter, null, 2)}\n` +
    `total docs ${total}\n` +
    `matches    ${filtered}\n` +
    `───────────────────────────────────────────────\n\n`
  );
}
```

When a query returns zero results, the tool prints a hint:

```ts
if (tasks.length === 0) {
  process.stdout.write(renderError("no tasks match that filter"));
  if (!flags.verbose) {
    process.stdout.write(`  hint: try --include-done or --verbose to inspect the filter\n`);
  }
  return;
}
```

---

## 21. Quick-Start Checklist for a New Tool

When Claude builds a new openclaw CLI tool, follow this order:

1. **Define `src/types.ts`** — domain types, enum types + const arrays, `ParsedFlags` interface
2. **Write `src/config.ts`** — `CONFIG_DIR`, `CONFIG_PATH`, `Config` interface, `loadConfig`, `saveConfig`
3. **Write `src/db.ts`** — three-tier credential resolution, `getDb()` singleton, `closeDb()`
4. **Write `src/render.ts`** — `C` object, `setPretty`, `visLen`, `renderTable`, all `render*` functions
5. **Write `src/utils.ts`** — `resolveTaskId`, time helpers, `logActivity`
6. **Write `src/flags.ts`** — `parseFlags()` seeding from config, full flag parser
7. **Write `src/commands/*.ts`** — one file per command, using the pattern in §12
8. **Write `src/index.ts`** — `printHelp`, command router, `try/catch/finally`
9. **Write `AGENT_PROMPT.md`** — compact prompt per §17
10. **Write `README.md`** — command reference tables, common agent patterns
11. **Test dev mode:** `bun src/index.ts --help`
12. **Build binary:** `bun run build`
13. **Run debug:** `./<toolname> debug`

---

## 22. What Makes a Tool "openclaw-compatible"

A tool is openclaw-compatible when:

- [ ] It compiles to a single binary with `bun build --compile`
- [ ] Credentials are stored in `~/.config/<toolname>/config.json`, not in `.env`
- [ ] Plain text output is the default — no ANSI escape codes without `--pretty`
- [ ] `--pretty` is explicitly documented as "human sessions only" in `AGENT_PROMPT.md`
- [ ] `--view mini` is the AI-recommended default view
- [ ] `--verbose` writes to stderr, not stdout
- [ ] Write commands output diffs, not bare success messages
- [ ] All write actions log to an activity collection with `triggered_by: "ai"`
- [ ] A `debug` command exists and connects to the live DB
- [ ] An `AGENT_PROMPT.md` file exists for injecting into AI context
- [ ] 8-char short IDs are shown in tables; both 8-char prefix and full 24-char ObjectId are accepted in write commands

---

*End of template. Reference `openclaw-taskboard-cli` as the canonical implementation.*
