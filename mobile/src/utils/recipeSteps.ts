import {
  Recipe,
  RecipeImport,
  UnifiedStep,
  PreparationStep,
  CookingStep,
} from "../../../shared/types";

/**
 * Builds a unified list of steps from a RecipeImport (used in preview).
 * RecipeImport can have steps as strings or PreparationStep/CookingStep objects.
 */
export function buildUnifiedStepsFromImport(
  recipe: RecipeImport,
): UnifiedStep[] {
  const prepSteps = recipe.preparationSteps || [];
  const cookSteps = recipe.cookingSteps || [];

  // Handle empty case
  if (prepSteps.length === 0 && cookSteps.length === 0) {
    return [
      {
        key: "fallback",
        order: 1,
        instruction: "No steps provided.",
        tag: "neutral",
      },
    ];
  }

  // Convert prep steps to unified format
  const unifiedPrep: UnifiedStep[] = prepSteps.map((step, index) => ({
    key: `prep-${index}`,
    order: index + 1,
    instruction: typeof step === "string" ? step : step.instruction,
    tag: "prep" as const,
    completed: typeof step === "object" ? step.completed : undefined,
    original: {
      source: "preparationSteps" as const,
      stepNumber: typeof step === "object" ? step.stepNumber : index + 1,
    },
  }));

  // Convert cook steps to unified format
  const unifiedCook: UnifiedStep[] = cookSteps.map((step, index) => ({
    key: `cook-${index}`,
    order: index + 1,
    instruction: typeof step === "string" ? step : step.instruction,
    tag: "cook" as const,
    duration: typeof step === "object" ? step.duration : undefined,
    completed: typeof step === "object" ? step.completed : undefined,
    original: {
      source: "cookingSteps" as const,
      stepNumber: typeof step === "object" ? step.stepNumber : index + 1,
    },
  }));

  // For preview, just concatenate prep then cook
  const result = [...unifiedPrep, ...unifiedCook];

  // Renumber the order field to be sequential
  result.forEach((step, index) => {
    step.order = index + 1;
  });

  return result;
}

/**
 * Builds a unified list of steps from a recipe's preparation and cooking steps.
 *
 * Ordering logic:
 * 1. If both arrays have stepNumbers and they form a continuous sequence
 *    (e.g., prep steps 1-3, cook steps 4-7), sort by stepNumber across both arrays.
 * 2. If stepNumbers overlap (e.g., both start at 1), keep prep first, then cook
 *    to maintain predictable order.
 * 3. Default: prep steps first (by array order), then cook steps (by array order).
 *
 * @param recipe - The recipe containing preparationSteps and cookingSteps
 * @returns Array of unified steps with tags and display order
 */
export function buildUnifiedSteps(recipe: Recipe): UnifiedStep[] {
  const prepSteps = recipe.preparationSteps || [];
  const cookSteps = recipe.cookingSteps || [];

  // Handle empty case
  if (prepSteps.length === 0 && cookSteps.length === 0) {
    return [
      {
        key: "fallback",
        order: 1,
        instruction: "No steps provided.",
        tag: "neutral",
      },
    ];
  }

  // Convert prep steps to unified format
  const unifiedPrep: UnifiedStep[] = prepSteps.map((step, index) => ({
    key: `prep-${index}`,
    order: step.stepNumber || index + 1,
    instruction: step.instruction,
    tag: "prep" as const,
    completed: step.completed,
    original: {
      source: "preparationSteps" as const,
      stepNumber: step.stepNumber,
    },
  }));

  // Convert cook steps to unified format
  const unifiedCook: UnifiedStep[] = cookSteps.map((step, index) => ({
    key: `cook-${index}`,
    order: step.stepNumber || index + 1,
    instruction: step.instruction,
    tag: "cook" as const,
    duration: step.duration,
    completed: step.completed,
    original: {
      source: "cookingSteps" as const,
      stepNumber: step.stepNumber,
    },
  }));

  // Determine if we should sort by stepNumber across both arrays
  const shouldInterleave = shouldInterleaveSteps(prepSteps, cookSteps);

  let result: UnifiedStep[];

  if (shouldInterleave) {
    // Merge and sort by stepNumber
    result = [...unifiedPrep, ...unifiedCook].sort(
      (a, b) => (a.original?.stepNumber || 0) - (b.original?.stepNumber || 0),
    );
  } else {
    // Keep prep first, then cook
    result = [...unifiedPrep, ...unifiedCook];
  }

  // Renumber the order field to be sequential
  result.forEach((step, index) => {
    step.order = index + 1;
  });

  return result;
}

/**
 * Determines if prep and cook steps should be interleaved based on stepNumbers.
 *
 * Returns true if:
 * - Both arrays have stepNumbers
 * - The stepNumbers form a continuous sequence (no overlaps)
 *
 * Returns false if:
 * - Either array lacks stepNumbers
 * - StepNumbers overlap (e.g., both start at 1)
 */
function shouldInterleaveSteps(
  prepSteps: PreparationStep[],
  cookSteps: CookingStep[],
): boolean {
  if (prepSteps.length === 0 || cookSteps.length === 0) {
    return false;
  }

  // Check if all steps have stepNumbers
  const prepHasNumbers = prepSteps.every((s) => s.stepNumber != null);
  const cookHasNumbers = cookSteps.every((s) => s.stepNumber != null);

  if (!prepHasNumbers || !cookHasNumbers) {
    return false;
  }

  // Get min/max stepNumbers for each array
  const prepNumbers = prepSteps.map((s) => s.stepNumber);
  const cookNumbers = cookSteps.map((s) => s.stepNumber);

  const prepMin = Math.min(...prepNumbers);
  const prepMax = Math.max(...prepNumbers);
  const cookMin = Math.min(...cookNumbers);
  const cookMax = Math.max(...cookNumbers);

  // Check if they overlap (both include some of the same numbers)
  // If they overlap, don't interleave
  const hasOverlap =
    (prepMin <= cookMax && prepMax >= cookMin) ||
    (cookMin <= prepMax && cookMax >= prepMin);

  if (hasOverlap) {
    // Check if they truly overlap or if one continues where the other left off
    // Continuous: prep ends at 3, cook starts at 4
    // Overlap: both have 1, 2, 3
    const prepSet = new Set(prepNumbers);
    const cookSet = new Set(cookNumbers);

    // Find common numbers
    const commonNumbers = prepNumbers.filter((n) => cookSet.has(n));

    // If there are common numbers, it's a true overlap - don't interleave
    if (commonNumbers.length > 0) {
      return false;
    }

    // Otherwise it's continuous - interleave
    return true;
  }

  // No overlap - they form separate ranges, so interleave
  return true;
}

/**
 * Maps unified steps back to the recipe schema for saving.
 * Used when editing steps and persisting to the database.
 *
 * Strategy:
 * - Steps tagged "prep" -> preparationSteps array
 * - Steps tagged "cook" or "neutral" -> cookingSteps array
 * - Renumber stepNumbers sequentially within each array (1..n)
 *
 * @param unifiedSteps - Array of unified steps from the UI
 * @returns Object with preparationSteps and cookingSteps arrays
 */
export function mapUnifiedStepsToRecipeSchema(unifiedSteps: UnifiedStep[]): {
  preparationSteps: PreparationStep[];
  cookingSteps: CookingStep[];
} {
  const prepSteps: PreparationStep[] = [];
  const cookSteps: CookingStep[] = [];

  unifiedSteps.forEach((step) => {
    if (step.tag === "prep") {
      prepSteps.push({
        stepNumber: prepSteps.length + 1,
        instruction: step.instruction,
        completed: step.completed,
      });
    } else {
      // "cook" or "neutral" -> cookingSteps
      cookSteps.push({
        stepNumber: cookSteps.length + 1,
        instruction: step.instruction,
        duration: step.duration,
        completed: step.completed,
      });
    }
  });

  return {
    preparationSteps: prepSteps,
    cookingSteps: cookSteps,
  };
}
