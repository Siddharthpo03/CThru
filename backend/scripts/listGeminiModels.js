import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is missing.");
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
);

if (!response.ok) {
  const error = await response.text();

  throw new Error(`Unable to load Gemini models: ${error}`);
}

const data = await response.json();

const models = (data.models || [])
  .filter((model) =>
    model.supportedGenerationMethods?.includes("generateContent"),
  )
  .map((model) => ({
    name: model.name,
    displayName: model.displayName,
    methods: model.supportedGenerationMethods,
  }));

console.log("\nAVAILABLE GEMINI GENERATE CONTENT MODELS\n");

models.forEach((model) => {
  console.log(model.name);
});
