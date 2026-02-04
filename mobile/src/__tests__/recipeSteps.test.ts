import {
  buildUnifiedSteps,
  mapUnifiedStepsToRecipeSchema,
} from "../utils/recipeSteps";
import { Recipe, UnifiedStep } from "../../../shared/types";

// Helper to create a minimal recipe
const createRecipe = (
  prepSteps: any[] = [],
  cookSteps: any[] = [],
): Recipe => ({
  id: "test-recipe",
  title: "Test Recipe",
  category: [],
  tags: [],
  ingredients: [],
  preparationSteps: prepSteps,
  cookingSteps: cookSteps,
  shoppingList: [],
  createdAt: new Date().toISOString(),
});

describe("buildUnifiedSteps", () => {
  test("returns fallback when both arrays are empty", () => {
    const recipe = createRecipe([], []);
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "fallback",
      order: 1,
      instruction: "No steps provided.",
      tag: "neutral",
    });
  });

  test("handles only prep steps", () => {
    const recipe = createRecipe(
      [
        { stepNumber: 1, instruction: "Chop onions" },
        { stepNumber: 2, instruction: "Mince garlic" },
      ],
      [],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      key: "prep-0",
      order: 1,
      instruction: "Chop onions",
      tag: "prep",
    });
    expect(result[1]).toMatchObject({
      key: "prep-1",
      order: 2,
      instruction: "Mince garlic",
      tag: "prep",
    });
  });

  test("handles only cook steps", () => {
    const recipe = createRecipe(
      [],
      [
        { stepNumber: 1, instruction: "Heat pan", duration: "2 min" },
        { stepNumber: 2, instruction: "Add oil", duration: "30 sec" },
      ],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      key: "cook-0",
      order: 1,
      instruction: "Heat pan",
      tag: "cook",
      duration: "2 min",
    });
    expect(result[1]).toMatchObject({
      key: "cook-1",
      order: 2,
      instruction: "Add oil",
      tag: "cook",
      duration: "30 sec",
    });
  });

  test("keeps prep first then cook when stepNumbers overlap", () => {
    const recipe = createRecipe(
      [
        { stepNumber: 1, instruction: "Prep step 1" },
        { stepNumber: 2, instruction: "Prep step 2" },
      ],
      [
        { stepNumber: 1, instruction: "Cook step 1" },
        { stepNumber: 2, instruction: "Cook step 2" },
      ],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(4);
    expect(result[0].instruction).toBe("Prep step 1");
    expect(result[1].instruction).toBe("Prep step 2");
    expect(result[2].instruction).toBe("Cook step 1");
    expect(result[3].instruction).toBe("Cook step 2");
    expect(result[0].tag).toBe("prep");
    expect(result[2].tag).toBe("cook");
  });

  test("interleaves steps when stepNumbers form continuous sequence", () => {
    const recipe = createRecipe(
      [
        { stepNumber: 1, instruction: "Chop vegetables" },
        { stepNumber: 2, instruction: "Mix marinade" },
        { stepNumber: 3, instruction: "Marinate chicken" },
      ],
      [
        { stepNumber: 4, instruction: "Heat grill" },
        { stepNumber: 5, instruction: "Grill chicken" },
        { stepNumber: 6, instruction: "Rest meat" },
      ],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(6);
    expect(result[0]).toMatchObject({
      order: 1,
      instruction: "Chop vegetables",
      tag: "prep",
    });
    expect(result[2]).toMatchObject({
      order: 3,
      instruction: "Marinate chicken",
      tag: "prep",
    });
    expect(result[3]).toMatchObject({
      order: 4,
      instruction: "Heat grill",
      tag: "cook",
    });
    expect(result[5]).toMatchObject({
      order: 6,
      instruction: "Rest meat",
      tag: "cook",
    });
  });

  test("interleaves when cook steps come before prep in numbering", () => {
    const recipe = createRecipe(
      [
        { stepNumber: 4, instruction: "Assemble dish" },
        { stepNumber: 5, instruction: "Garnish" },
      ],
      [
        { stepNumber: 1, instruction: "Boil water" },
        { stepNumber: 2, instruction: "Cook pasta" },
        { stepNumber: 3, instruction: "Drain" },
      ],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      order: 1,
      instruction: "Boil water",
      tag: "cook",
    });
    expect(result[2]).toMatchObject({
      order: 3,
      instruction: "Drain",
      tag: "cook",
    });
    expect(result[3]).toMatchObject({
      order: 4,
      instruction: "Assemble dish",
      tag: "prep",
    });
  });

  test("preserves completed status", () => {
    const recipe = createRecipe(
      [
        { stepNumber: 1, instruction: "Chop onions", completed: true },
        { stepNumber: 2, instruction: "Mince garlic", completed: false },
      ],
      [{ stepNumber: 3, instruction: "Heat pan", completed: true }],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result[0].completed).toBe(true);
    expect(result[1].completed).toBe(false);
    expect(result[2].completed).toBe(true);
  });

  test("handles missing stepNumbers by using array order", () => {
    const recipe = createRecipe(
      [{ instruction: "Prep 1" }, { instruction: "Prep 2" }],
      [{ instruction: "Cook 1" }],
    );
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(3);
    expect(result[0].instruction).toBe("Prep 1");
    expect(result[1].instruction).toBe("Prep 2");
    expect(result[2].instruction).toBe("Cook 1");
  });

  test("handles null/undefined arrays", () => {
    const recipe = {
      ...createRecipe(),
      preparationSteps: null as any,
      cookingSteps: undefined as any,
    };
    const result = buildUnifiedSteps(recipe);

    expect(result).toHaveLength(1);
    expect(result[0].instruction).toBe("No steps provided.");
  });
});

describe("mapUnifiedStepsToRecipeSchema", () => {
  test("maps prep-tagged steps to preparationSteps", () => {
    const unifiedSteps: UnifiedStep[] = [
      {
        key: "prep-0",
        order: 1,
        instruction: "Chop onions",
        tag: "prep",
      },
      {
        key: "prep-1",
        order: 2,
        instruction: "Mince garlic",
        tag: "prep",
        completed: true,
      },
    ];

    const result = mapUnifiedStepsToRecipeSchema(unifiedSteps);

    expect(result.preparationSteps).toHaveLength(2);
    expect(result.preparationSteps[0]).toMatchObject({
      stepNumber: 1,
      instruction: "Chop onions",
    });
    expect(result.preparationSteps[1]).toMatchObject({
      stepNumber: 2,
      instruction: "Mince garlic",
      completed: true,
    });
    expect(result.cookingSteps).toHaveLength(0);
  });

  test("maps cook and neutral-tagged steps to cookingSteps", () => {
    const unifiedSteps: UnifiedStep[] = [
      {
        key: "cook-0",
        order: 1,
        instruction: "Heat pan",
        tag: "cook",
        duration: "2 min",
      },
      {
        key: "neutral-0",
        order: 2,
        instruction: "Wait",
        tag: "neutral",
      },
    ];

    const result = mapUnifiedStepsToRecipeSchema(unifiedSteps);

    expect(result.cookingSteps).toHaveLength(2);
    expect(result.cookingSteps[0]).toMatchObject({
      stepNumber: 1,
      instruction: "Heat pan",
      duration: "2 min",
    });
    expect(result.cookingSteps[1]).toMatchObject({
      stepNumber: 2,
      instruction: "Wait",
    });
    expect(result.preparationSteps).toHaveLength(0);
  });

  test("renumbers steps sequentially within each array", () => {
    const unifiedSteps: UnifiedStep[] = [
      { key: "prep-0", order: 1, instruction: "Prep 1", tag: "prep" },
      { key: "cook-0", order: 2, instruction: "Cook 1", tag: "cook" },
      { key: "prep-1", order: 3, instruction: "Prep 2", tag: "prep" },
      { key: "cook-1", order: 4, instruction: "Cook 2", tag: "cook" },
    ];

    const result = mapUnifiedStepsToRecipeSchema(unifiedSteps);

    expect(result.preparationSteps[0].stepNumber).toBe(1);
    expect(result.preparationSteps[1].stepNumber).toBe(2);
    expect(result.cookingSteps[0].stepNumber).toBe(1);
    expect(result.cookingSteps[1].stepNumber).toBe(2);
  });

  test("handles empty array", () => {
    const result = mapUnifiedStepsToRecipeSchema([]);

    expect(result.preparationSteps).toHaveLength(0);
    expect(result.cookingSteps).toHaveLength(0);
  });

  test("preserves duration and completed fields", () => {
    const unifiedSteps: UnifiedStep[] = [
      {
        key: "cook-0",
        order: 1,
        instruction: "Cook pasta",
        tag: "cook",
        duration: "8-10 min",
        completed: true,
      },
    ];

    const result = mapUnifiedStepsToRecipeSchema(unifiedSteps);

    expect(result.cookingSteps[0]).toMatchObject({
      stepNumber: 1,
      instruction: "Cook pasta",
      duration: "8-10 min",
      completed: true,
    });
  });
});
