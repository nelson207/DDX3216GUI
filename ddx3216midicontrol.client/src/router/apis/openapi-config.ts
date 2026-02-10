import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
<<<<<<< HEAD
  schemaFile: "http://localhost:1790/swagger/v1/swagger.json",
=======
  schemaFile: "http://localhost:5032/swagger/v1/swagger.json",
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  apiFile: "./emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./MidiApi.ts",
  exportName: "MidiApi",
  hooks: true,
};

export default config;
