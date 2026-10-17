// Cross-product helpers for API routes that validate a milestone/form id
// without needing to know which product it belongs to: the union of every
// product file's steps (lib/productRegistry.ts), any status, hidden included.
//
// First id wins: step ids are unique across today's products (ob-/bd-/ts-/gl-/
// pl- for Scale, rsp- for Respond, bss- for BSS), and a custom product keeps
// its base's ids for the steps it keeps, so the union holds each id once with
// the first product's wording. Only the form route goes per client
// (formStepFor), so a reused formId never ticks the wrong step.
import { allPortalSteps, uploadStepIds } from "./productRegistry";
import type { MilestoneTemplate } from "./journeyTypes";

export const allMilestoneTemplates: MilestoneTemplate[] = allPortalSteps();

/** Steps that take a file upload. */
export const uploadMilestoneIds = new Set(uploadStepIds());
