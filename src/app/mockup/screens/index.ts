import type { MockupScreen } from "../types";

import { screen as enrollment } from "./enrollment";
import { screen as waitingApproval } from "./waiting-approval";
import { screen as pinUnlock } from "./pin-unlock";
import { screen as pinForgotten } from "./pin-forgotten";
import { screen as filesList } from "./files-list";
import { screen as newFile } from "./new-file";
import { screen as fileDetails } from "./file-details";
import { screen as photoCapture } from "./photo-capture";
import { screen as imageMetadata } from "./image-metadata";
import { screen as pipelines } from "./pipelines";
import { screen as sourceSelection } from "./source-selection";
import { screen as generationWorkspace } from "./generation-workspace";
import { screen as phoneWorkspace } from "./phone-workspace";
import { screen as generationResult } from "./generation-result";
import { screen as generationDetail } from "./generation-detail";
import { screen as referenceCatalog } from "./reference-catalog";

export const screens: MockupScreen[] = [
  enrollment,
  waitingApproval,
  pinUnlock,
  pinForgotten,
  filesList,
  newFile,
  fileDetails,
  photoCapture,
  imageMetadata,
  pipelines,
  sourceSelection,
  generationWorkspace,
  phoneWorkspace,
  generationResult,
  generationDetail,
  referenceCatalog,
];
