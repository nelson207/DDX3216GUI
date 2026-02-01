import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "http://localhost:5032/swagger/v1/swagger.json",
  apiFile: "./emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./MidiApi.ts",
  exportName: "MidiApi",
  hooks: true,
};

export default config;
