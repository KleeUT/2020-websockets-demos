import { region } from "./constants";
export const stage = "v1";

export const configProvider = (): Config => ({
  tableName: process.env.DYNAMO_TABLE || "Missing Table Name",
  endpointApi: `https://${process.env.WEBSOCKET_API_ID}.execute-api.${region}.amazonaws.com/${stage}`
});

export type Config = {
  tableName: string;
  endpointApi: string;
};
