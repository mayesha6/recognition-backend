export const normalizeRecognitionValues = (input: any): string[] => {
  if (!input) return [];

  // string case
  if (typeof input === "string") {
    return input.split(",").map(v => v.trim());
  }

  // array case
  if (Array.isArray(input)) {
    return input.map(v =>
      typeof v === "object" ? v.value : v
    );
  }

  return [];
};