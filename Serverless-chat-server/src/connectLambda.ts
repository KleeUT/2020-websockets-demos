import { APIGatewayEvent, Context } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
// import {} from "@aws-"
// import { PutItemInput } from '@types/aws-sdk'
// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

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
export const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log("EVENT:", event);
  console.log("CONTEXT:", context);
  console.log("DYNAMO TABLE", process.env.DYNAMO_TABLE);
  const db = new DynamoDB({
    region: "ap-southeast-2"
  });
  var params: DynamoDB.PutItemInput = {
    TableName: process.env.DYNAMO_TABLE || "",
    Item: {
      kid: { S: `connection` },
      sk: { S: `connection:${event.requestContext.connectionId}` }
    }
  };
  try {
    await db.putItem(params).promise();
    // const ret = await axios(url);
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "hello world"
        // location: ret.data.trim()
      })
    };
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
};
