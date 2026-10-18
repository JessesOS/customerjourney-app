// Cross-product helpers for API routes that validate a milestone/form id
// without needing to know which product it belongs to: the union of every
// product file's steps (lib/productRegistry.ts), any status, hidden included.
//
// First id wins: step ids are unique across today's products (ob-/bd-/ts-/gl-/
// pl- for Scale, rsp- for Respond, bss- for BSS), and a custom product keeps
// its base's ids for the steps it keeps, so the union holds each id once with
// the first product's wording. Only the form route goes per client
// (formStepFor), so a reused formId never ticks the wrong step.
//
// The upload route and the admin forms list read hasUpload, hasEditableContent
// and formId from this union, so every product that has a step id must agree
// on them. Two guards keep it so: defineCustomProduct (products/custom.ts)
// throws if a custom product changes them on an inherited step, and
// products:check ("integrity") fails if two products disagree, if a custom
// product adds an id another product has, or if its idPrefix starts another
// product's ids.
import { allPortalSteps, uploadStayOpenStepIds, uploadStepIds } from "./productRegistry";
import type { MilestoneTemplate } from "./journeyTypes";

export const allMilestoneTemplates: MilestoneTemplate[] = allPortalSteps();

/** Steps that take a file upload. */
export const uploadMilestoneIds = new Set(uploadStepIds());

/** Upload steps that keep taking files after the client ticks them (uploadOptions.stayOpen). */
export const uploadStayOpenIds = new Set(uploadStayOpenStepIds());
