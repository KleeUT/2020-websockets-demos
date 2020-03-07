import { Context, APIGatewayEvent } from "aws-lambda";
import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk";
import { configProvider, Config } from "./configProvider";
import { region, connectionKey, connectionPrefix } from "./constants";

export const handler = async (event: APIGatewayEvent, context: Context) => {
  const config = configProvider();

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: "No body in request"
      };
    }

    const activeConnectionsPromise = retrieveAllActiveConnectionsFromDynamoDB(
      config
    );

    const manApi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: config.endpointApi
    });
    const SendingConnectionId =
      event.requestContext.connectionId || "No Connection";

    const existingConnections = await activeConnectionsPromise;

    const sendPromises = existingConnections.map(connection => {
      const params: ApiGatewayManagementApi.PostToConnectionRequest = {
        ConnectionId: connection || "",
        Data: event.body as String
      };
      console.log(
        `attempting to send welcome message to ${connection}, with api url ${config.endpointApi}`
      );
      if (connection == SendingConnectionId) {
        console.log("not sending back to connection");
        return Promise.resolve();
      }
      return manApi
        .postToConnection(params)
        .promise()
        .then(response =>
          console.log(`done sending to ${connection}`, response)
        )
        .catch(err => {
          console.log(`Couldnt send to connection ${connection}`, err);
          removeConnectionOnFailure(config, connection);
        });
    });
    console.log(
      `Waiting for ${existingConnections.length} functions to finish`
    );
    await Promise.all(sendPromises);
    console.log("Done");
    return { statusCode: 200, body: JSON.stringify({ message: "Hello" }) };
  } catch (err) {
    console.error("Something went wrong", err);
    return err;
  }
};

const removeConnectionOnFailure = async (
  config: Config,
  connectionId: string
): Promise<void> => {
  try {
    const db = new DynamoDB({
      region: "ap-southeast-2"
    });
    await db
      .deleteItem({
        TableName: config.tableName,
        Key: {
          kid: { S: connectionKey },
          sk: { S: `${connectionPrefix}${connectionId}` }
        }
      })
      .promise();
    console.log(`Removed connection ${connectionId}`);
  } catch (err) {
    console.log(err);
    return err;
  }
};

const retrieveAllActiveConnectionsFromDynamoDB = async (
  config: Config
): Promise<string[]> => {
  const db = new DynamoDB({
    region
  });
  const dynamoResponse = await db
    .query({
      TableName: config.tableName,
      KeyConditions: {
        kid: {
          ComparisonOperator: "EQ",
          AttributeValueList: [{ S: connectionKey }]
        },
        sk: {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: [{ S: connectionPrefix }]
        }
      }
    })
    .promise();
  if (dynamoResponse.Items === undefined) {
    return [];
  }
  return dynamoResponse.Items.map(item => {
    const str = (item.sk || {}).S || connectionPrefix;
    const out = str.substr(connectionPrefix.length, str.length);
    console.log(`Raw connection from Dynamo: ${str} trimmed ${out}`);
    return out;
  });
};
