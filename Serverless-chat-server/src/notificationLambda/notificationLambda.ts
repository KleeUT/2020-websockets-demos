import { DynamoDBStreamEvent, Context } from "aws-lambda";
import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk";
import { configProvider, Config } from "../configProvider";
import {
  isItAQuestionUpdateEvent,
  getNewQuestionInfoFrom
} from "./eventInterpreter";
import {
  currentQuestionKey,
  endpointApi,
  region,
  connectionKey,
  connectionPrefix,
  questionKey
} from "./constants";
import { UpdatedQuestion, UserFacingQuetion } from "./interfaces";

// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const handler = async (event: DynamoDBStreamEvent, context: Context) => {
  const config = configProvider();

  try {
    // console.log("JOSN EVENT:", JSON.stringify(event))
    if (!isItAQuestionUpdateEvent(event)) {
      return "done";
    }
    const activeConnectionsPromise = allActiveConnections(config);
    const newQuestion = getNewQuestionInfoFrom(event);
    const userFacingQuestionPromise = getQuestion(config, newQuestion);
    // console.log("New Question:", newQuestion)

    const manApi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: endpointApi
    });

    const userFacingQuetion = await userFacingQuestionPromise;
    // console.log("userFacingQuetion", userFacingQuetion);

    const existingConnections = await activeConnectionsPromise;
    // console.log('connections,', existingConnections)

    const sendPromises = existingConnections.map(connection => {
      const params: ApiGatewayManagementApi.PostToConnectionRequest = {
        ConnectionId: connection || "",
        Data: JSON.stringify(userFacingQuetion)
      };
      console.log(
        `attempting to send welcome message to ${connection}, with api url ${endpointApi}`
      );
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
    return "HAPPY DAYS";
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
    // const ret = await axios(url);
  } catch (err) {
    console.log(err);
    return err;
  }
};

const getQuestion = async (
  config: Config,
  question: UpdatedQuestion
): Promise<UserFacingQuetion> => {
  if (question.break) {
    return {
      title: "Break",
      body: "",
      break: question.break
    };
  }
  const db = new DynamoDB({
    region
  });
  const item = await db
    .getItem({
      TableName: config.tableName,
      Key: {
        kid: { S: questionKey },
        sk: { S: `r${question.round}:q${question.question}` }
      }
    })
    .promise();
  console.log("Question Item", item);

  return {
    title: `Round: ${question.round} Question: ${question.question}`,
    body: (item.Item || {}).markdown.S || "",
    break: false
  };
};

const allActiveConnections = async (config: Config): Promise<string[]> => {
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
  // console.log(dynamoResponse.Items);
  if (dynamoResponse.Items === undefined) {
    return [];
  }
  return dynamoResponse.Items.map(item => {
    const str = (item.sk || {}).S || connectionPrefix;
    return str.substr(connectionPrefix.length, str.length);
  });
};
