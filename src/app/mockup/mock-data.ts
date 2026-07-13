import type { ProjectType, WorkflowStage } from "@/types/atlas";

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                   */
/* ------------------------------------------------------------------ */

export const clockPositions = ["12", "3", "6", "9"] as const;
export type ClockPosition = (typeof clockPositions)[number];

export const clockPositionHints: Record<ClockPosition, string> = {
  "12": "At the door",
  "3": "Right of the door",
  "6": "Facing the door",
  "9": "Left of the door",
};

export const roomChoices = [
  "Kitchen",
  "Bathroom",
  "Ensuite",
  "Laundry",
  "Powder room",
  "Walk-in robe",
] as const;

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

export type MockFile = {
  id: string;
  title: string;
  projectType: ProjectType;
  stage: WorkflowStage;
  contactName: string;
  suburb: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  generationCount: number;
};

export const mockFiles: MockFile[] = [
  {
    id: "file-hartley",
    title: "Hartley — Main Bathroom",
    projectType: "bathroom",
    stage: "image_concept",
    contactName: "Priya & Dan Hartley",
    suburb: "Kelvin Grove",
    createdAt: "28 Jun 2026",
    updatedAt: "Today, 9:41 am",
    imageCount: 9,
    generationCount: 4,
  },
  {
    id: "file-osman",
    title: "Osman — Kitchen & Butler's",
    projectType: "kitchen",
    stage: "before_photo",
    contactName: "Leila Osman",
    suburb: "Ashgrove",
    createdAt: "6 Jul 2026",
    updatedAt: "Yesterday, 4:18 pm",
    imageCount: 5,
    generationCount: 0,
  },
  {
    id: "file-nguyen",
    title: "Nguyen — Ensuite Refresh",
    projectType: "bathroom",
    stage: "proposal_needed",
    contactName: "Minh Nguyen",
    suburb: "The Gap",
    createdAt: "19 Jun 2026",
    updatedAt: "Fri, 2:02 pm",
    imageCount: 12,
    generationCount: 7,
  },
  {
    id: "file-brennan",
    title: "Brennan — Laundry Rebuild",
    projectType: "laundry",
    stage: "new_file",
    contactName: "Cate Brennan",
    suburb: "Paddington",
    createdAt: "12 Jul 2026",
    updatedAt: "Sun, 10:07 am",
    imageCount: 0,
    generationCount: 0,
  },
  {
    id: "file-whitfield",
    title: "Whitfield — Powder Room",
    projectType: "bathroom",
    stage: "accepted",
    contactName: "George Whitfield",
    suburb: "Red Hill",
    createdAt: "2 Jun 2026",
    updatedAt: "30 Jun 2026",
    imageCount: 14,
    generationCount: 9,
  },
  {
    id: "file-marsh",
    title: "Marsh — Stone Benchtops",
    projectType: "materials",
    stage: "before_photo",
    contactName: "Ellen Marsh",
    suburb: "Bardon",
    createdAt: "9 Jul 2026",
    updatedAt: "Thu, 8:55 am",
    imageCount: 3,
    generationCount: 1,
  },
];

/** The file most screens should anchor on. */
export const activeFile = mockFiles[0];

/* ------------------------------------------------------------------ */
/* File assets (site photos + generated outputs)                       */
/* ------------------------------------------------------------------ */

export type MockAssetOrigin = "camera" | "upload" | "generated";

export type MockAsset = {
  id: string;
  fileId: string;
  kind: "site_visit" | "ai_generated";
  label: string;
  /** Seed for MockImage — keeps the same placeholder everywhere it appears. */
  seed: string;
  room?: (typeof roomChoices)[number] | string;
  clock?: ClockPosition;
  tags: string[];
  origin: MockAssetOrigin;
  capturedAt: string;
  bunnyKey: string;
};

export const mockAssets: MockAsset[] = [
  {
    id: "asset-vanity-wall",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "Vanity wall",
    seed: "hartley-vanity-wall",
    room: "Bathroom",
    clock: "9",
    tags: ["vanity", "existing tiles"],
    origin: "camera",
    capturedAt: "Today, 9:12 am",
    bunnyKey: "files/file-hartley/site/vanity-wall.jpg",
  },
  {
    id: "asset-shower-corner",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "Shower corner",
    seed: "hartley-shower-corner",
    room: "Bathroom",
    clock: "3",
    tags: ["shower", "screen"],
    origin: "camera",
    capturedAt: "Today, 9:14 am",
    bunnyKey: "files/file-hartley/site/shower-corner.jpg",
  },
  {
    id: "asset-bath-window",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "Bath under window",
    seed: "hartley-bath-window",
    room: "Bathroom",
    clock: "6",
    tags: ["bath", "window", "natural light"],
    origin: "camera",
    capturedAt: "Today, 9:16 am",
    bunnyKey: "files/file-hartley/site/bath-window.jpg",
  },
  {
    id: "asset-doorway",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "From the doorway",
    seed: "hartley-doorway",
    room: "Bathroom",
    clock: "12",
    tags: ["overview"],
    origin: "upload",
    capturedAt: "Today, 9:20 am",
    bunnyKey: "files/file-hartley/site/doorway.jpg",
  },
  {
    id: "asset-ensuite-mirror",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "Ensuite mirror nook",
    seed: "hartley-ensuite-mirror",
    room: "Ensuite",
    tags: ["mirror"],
    origin: "camera",
    capturedAt: "28 Jun, 2:40 pm",
    bunnyKey: "files/file-hartley/site/ensuite-mirror.jpg",
  },
  {
    id: "asset-concept-terrazzo",
    fileId: "file-hartley",
    kind: "ai_generated",
    label: "Terrazzo + warm oak concept",
    seed: "hartley-concept-terrazzo",
    room: "Bathroom",
    tags: ["concept", "terrazzo", "oak"],
    origin: "generated",
    capturedAt: "Today, 9:41 am",
    bunnyKey: "files/file-hartley/generated/terrazzo-oak.png",
  },
  {
    id: "asset-concept-sage",
    fileId: "file-hartley",
    kind: "ai_generated",
    label: "Sage wall-hung vanity concept",
    seed: "hartley-concept-sage",
    room: "Bathroom",
    tags: ["concept", "sage", "wall-hung"],
    origin: "generated",
    capturedAt: "Yesterday, 5:02 pm",
    bunnyKey: "files/file-hartley/generated/sage-vanity.png",
  },
  {
    id: "asset-concept-marble",
    fileId: "file-hartley",
    kind: "ai_generated",
    label: "Marble niche shower concept",
    seed: "hartley-concept-marble",
    room: "Bathroom",
    tags: ["concept", "marble", "niche"],
    origin: "generated",
    capturedAt: "Yesterday, 4:44 pm",
    bunnyKey: "files/file-hartley/generated/marble-niche.png",
  },
  {
    id: "asset-hall-approach",
    fileId: "file-hartley",
    kind: "site_visit",
    label: "Hallway approach",
    seed: "hartley-hall-approach",
    tags: [],
    origin: "camera",
    capturedAt: "28 Jun, 2:36 pm",
    bunnyKey: "files/file-hartley/site/hall-approach.jpg",
  },
];

/* ------------------------------------------------------------------ */
/* Reference catalog                                                   */
/* ------------------------------------------------------------------ */

export type MockReferenceCategory = {
  slug: string;
  label: string;
};

export const referenceCategories: MockReferenceCategory[] = [
  { slug: "vanities", label: "Vanities" },
  { slug: "baths", label: "Baths" },
  { slug: "sinks", label: "Sinks" },
  { slug: "toilets", label: "Toilets" },
  { slug: "showers", label: "Showers" },
  { slug: "racks", label: "Racks" },
  { slug: "tapware", label: "Tapware" },
  { slug: "materials", label: "Materials" },
  { slug: "flooring", label: "Flooring" },
  { slug: "lighting", label: "Lighting" },
  { slug: "mirrors", label: "Mirrors" },
  { slug: "benchtops", label: "Benchtops" },
];

export type MockReference = {
  id: string;
  category: string;
  label: string;
  seed: string;
  tags: string[];
  addedBy: string;
  addedAt: string;
};

export const mockReferences: MockReference[] = [
  { id: "ref-oak-floating", category: "vanities", label: "Floating oak 1200", seed: "ref-oak-floating", tags: ["oak", "wall-hung", "double basin"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-sage-shaker", category: "vanities", label: "Sage shaker 900", seed: "ref-sage-shaker", tags: ["sage", "shaker", "brass pulls"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-matte-black-vanity", category: "vanities", label: "Matte black slimline", seed: "ref-matte-black-vanity", tags: ["black", "slimline"], addedBy: "atlas-agent", addedAt: "5 Jul 2026" },
  { id: "ref-freestanding-oval", category: "baths", label: "Freestanding oval", seed: "ref-freestanding-oval", tags: ["freestanding", "matte white"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-backtowall-bath", category: "baths", label: "Back-to-wall 1700", seed: "ref-backtowall-bath", tags: ["back-to-wall"], addedBy: "atlas-agent", addedAt: "8 Jul 2026" },
  { id: "ref-stone-basin", category: "sinks", label: "Carved stone basin", seed: "ref-stone-basin", tags: ["stone", "above counter"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-semi-recessed", category: "sinks", label: "Semi-recessed white", seed: "ref-semi-recessed", tags: ["semi-recessed"], addedBy: "atlas-agent", addedAt: "6 Jul 2026" },
  { id: "ref-rimless-wallfaced", category: "toilets", label: "Rimless wall-faced", seed: "ref-rimless-wallfaced", tags: ["rimless", "soft close"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-walkin-frameless", category: "showers", label: "Walk-in frameless", seed: "ref-walkin-frameless", tags: ["frameless", "walk-in"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-brushed-nickel-rail", category: "showers", label: "Brushed nickel rail set", seed: "ref-brushed-nickel-rail", tags: ["brushed nickel", "rail"], addedBy: "atlas-agent", addedAt: "9 Jul 2026" },
  { id: "ref-ladder-rack", category: "racks", label: "Heated ladder rack", seed: "ref-ladder-rack", tags: ["heated", "black"], addedBy: "atlas-agent", addedAt: "4 Jul 2026" },
  { id: "ref-brass-mixer", category: "tapware", label: "Aged brass mixer", seed: "ref-brass-mixer", tags: ["brass", "mixer"], addedBy: "atlas-agent", addedAt: "4 Jul 2026" },
  { id: "ref-terrazzo-slab", category: "materials", label: "Terrazzo blush slab", seed: "ref-terrazzo-slab", tags: ["terrazzo", "blush"], addedBy: "atlas-agent", addedAt: "3 Jul 2026" },
  { id: "ref-zellige-fern", category: "materials", label: "Zellige fern tile", seed: "ref-zellige-fern", tags: ["zellige", "green", "gloss"], addedBy: "atlas-agent", addedAt: "7 Jul 2026" },
  { id: "ref-tumbled-travertine", category: "flooring", label: "Tumbled travertine", seed: "ref-tumbled-travertine", tags: ["travertine", "tumbled"], addedBy: "atlas-agent", addedAt: "5 Jul 2026" },
  { id: "ref-herringbone-oak", category: "flooring", label: "Herringbone oak", seed: "ref-herringbone-oak", tags: ["oak", "herringbone"], addedBy: "atlas-agent", addedAt: "5 Jul 2026" },
  { id: "ref-arch-sconce", category: "lighting", label: "Arched wall sconce", seed: "ref-arch-sconce", tags: ["sconce", "warm"], addedBy: "atlas-agent", addedAt: "6 Jul 2026" },
  { id: "ref-pill-mirror", category: "mirrors", label: "Pill mirror backlit", seed: "ref-pill-mirror", tags: ["pill", "backlit"], addedBy: "atlas-agent", addedAt: "6 Jul 2026" },
  { id: "ref-honed-marble-bench", category: "benchtops", label: "Honed marble 20mm", seed: "ref-honed-marble-bench", tags: ["marble", "honed"], addedBy: "atlas-agent", addedAt: "8 Jul 2026" },
];

/* ------------------------------------------------------------------ */
/* Generations                                                         */
/* ------------------------------------------------------------------ */

export type MockGenerationStatus =
  | "complete"
  | "generating"
  | "failed"
  | "blocked"
  | "retryable";

export const generationStatusLabels: Record<MockGenerationStatus, string> = {
  complete: "Saved",
  generating: "Generating",
  failed: "Failed",
  blocked: "Blocked",
  retryable: "Retry available",
};

export type MockGeneration = {
  id: string;
  fileId: string;
  title: string;
  status: MockGenerationStatus;
  createdAt: string;
  /** Seed of the before image (site photo or a previous output). */
  sourceSeed: string;
  sourceLabel: string;
  /** Seed of the generated output; absent while generating/failed. */
  resultSeed?: string;
  prompt: string;
  referenceIds: string[];
  /** Set when this generation continued from a previous output. */
  parentId?: string;
  note?: string;
};

export const mockGenerations: MockGeneration[] = [
  {
    id: "gen-terrazzo-2",
    fileId: "file-hartley",
    title: "Terrazzo floor, warmer light",
    status: "complete",
    createdAt: "Today, 9:41 am",
    sourceSeed: "hartley-concept-sage",
    sourceLabel: "Sage wall-hung vanity concept",
    resultSeed: "hartley-concept-terrazzo",
    prompt:
      "Keep the sage vanity but swap the flooring to blush terrazzo and warm the lighting to late-afternoon.",
    referenceIds: ["ref-terrazzo-slab", "ref-arch-sconce"],
    parentId: "gen-sage-1",
  },
  {
    id: "gen-sage-1",
    fileId: "file-hartley",
    title: "Sage vanity direction",
    status: "complete",
    createdAt: "Yesterday, 5:02 pm",
    sourceSeed: "hartley-vanity-wall",
    sourceLabel: "Vanity wall",
    resultSeed: "hartley-concept-sage",
    prompt:
      "Replace the existing vanity with a sage shaker wall-hung vanity, brass mixer, and a backlit pill mirror.",
    referenceIds: ["ref-sage-shaker", "ref-brass-mixer", "ref-pill-mirror"],
  },
  {
    id: "gen-marble-niche",
    fileId: "file-hartley",
    title: "Marble niche shower",
    status: "complete",
    createdAt: "Yesterday, 4:44 pm",
    sourceSeed: "hartley-shower-corner",
    sourceLabel: "Shower corner",
    resultSeed: "hartley-concept-marble",
    prompt:
      "Frameless walk-in shower with a honed marble niche and brushed nickel rail set.",
    referenceIds: ["ref-walkin-frameless", "ref-brushed-nickel-rail", "ref-honed-marble-bench"],
  },
  {
    id: "gen-blocked-brand",
    fileId: "file-hartley",
    title: "Blocked request",
    status: "blocked",
    createdAt: "Yesterday, 4:31 pm",
    sourceSeed: "hartley-shower-corner",
    sourceLabel: "Shower corner",
    prompt: "Recreate the shower exactly like the Hilton penthouse marketing photos.",
    referenceIds: [],
    note: "The provider declined this prompt. Rephrase without brand or third-party photo requests.",
  },
  {
    id: "gen-timeout",
    fileId: "file-hartley",
    title: "Freestanding bath swap",
    status: "retryable",
    createdAt: "Yesterday, 4:12 pm",
    sourceSeed: "hartley-bath-window",
    sourceLabel: "Bath under window",
    prompt: "Swap the built-in bath for a freestanding oval under the window.",
    referenceIds: ["ref-freestanding-oval"],
    note: "The image service timed out. The request can be retried as-is.",
  },
  {
    id: "gen-failed-upload",
    fileId: "file-hartley",
    title: "Travertine floor test",
    status: "failed",
    createdAt: "28 Jun, 3:12 pm",
    sourceSeed: "hartley-doorway",
    sourceLabel: "From the doorway",
    prompt: "Tumbled travertine floor throughout, keep everything else.",
    referenceIds: ["ref-tumbled-travertine"],
    note: "Generation failed before completion. No image was produced.",
  },
];

export function referencesById(ids: string[]): MockReference[] {
  return ids
    .map((id) => mockReferences.find((ref) => ref.id === id))
    .filter((ref): ref is MockReference => Boolean(ref));
}

/* ------------------------------------------------------------------ */
/* Device auth                                                         */
/* ------------------------------------------------------------------ */

export const mockDevice = {
  name: "Site iPad",
  model: "iPad Pro 11\"",
  activationCode: "482 913",
  fingerprint: "9F2C 71AB 04E6 D830 55C1 B4F7 2A9D E1C8",
  requestedAt: "Today, 8:57 am",
};

export const mockApprovedDevices = [
  { id: "dev-ipad", name: "Site iPad", approvedAt: "14 Jul 2026", lastSeen: "Today, 9:41 am" },
  { id: "dev-pixel", name: "Marco's Pixel", approvedAt: "2 Jul 2026", lastSeen: "Yesterday, 6:10 pm" },
  { id: "dev-studio", name: "Studio desktop", approvedAt: "20 Jun 2026", lastSeen: "Today, 8:12 am" },
];
