import { DynamoDBStreamEvent } from "aws-lambda";
import { handler as notificationLambdaHandler } from "./notificationLambda";
import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { configProvider, Config } from "../configProvider";
import {
  breakEvent,
  newConnectionEvent,
  currentQuestionChangedEvent
} from "./testEvents";
import { connectionPrefix, questionKey, connectionKey } from "./constants";

jest.mock("aws-sdk");
jest.mock("../configProvider");

const testTableName = "Test Table";
const mockedDynamo = (DynamoDB as unknown) as jest.Mock<{}>;
describe(notificationLambdaHandler, () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("Should exit quickly on an event that isnt question updated", async () => {
    const { query } = aMockDynamo();
    aMockConfig();
    const result = await notificationLambdaHandler(
      newConnectionEvent(),
      newContext()
    );
    expect(query).not.toHaveBeenCalled();
    expect(result).toBe("done");
  });

  it("Should fetch connections from dynamo on updateEvent", async () => {
    const { query } = aMockDynamo();
    query.mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) });
    aMockConfig();
    await notificationLambdaHandler(breakEvent(), newContext());

    expect(query).toHaveBeenCalledWith({
      KeyConditions: {
        kid: {
          AttributeValueList: [{ S: connectionKey }],
          ComparisonOperator: "EQ"
        },
        sk: {
          AttributeValueList: [{ S: connectionPrefix }],
          ComparisonOperator: "BEGINS_WITH"
        }
      },
      TableName: testTableName
    });
  });

  it("Should fetch question from dynamo based on event", async () => {
    const { getItem, query } = aMockDynamo();
    getItem.mockReturnValue({ promise: () => Promise.resolve({}) });
    query.mockReturnValue({
      promise: () => Promise.resolve({ Items: [] })
    });

    aMockConfig();
    await notificationLambdaHandler(
      currentQuestionChangedEvent(),
      newContext()
    );

    expect(getItem).toHaveBeenCalledWith({
      Key: {
        kid: { S: questionKey },
        sk: { S: `r1:q1` }
      },
      TableName: testTableName
    });
  });

  it("Should get all connections on question change event", async () => {
    const { query } = aMockDynamo();
    query.mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) });
    aMockConfig();
    await notificationLambdaHandler(breakEvent(), newContext());

    expect(query).toHaveBeenCalledWith({
      KeyConditions: {
        kid: {
          ComparisonOperator: "EQ",
          AttributeValueList: [{ S: connectionKey }]
        },
        sk: {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: [{ S: connectionPrefix }]
        }
      },
      TableName: testTableName
    });
  });

  it("Should not send update when no connections configured", async () => {
    const { query } = aMockDynamo();
    query.mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) });
    const { postToConnection } = sendingToClientsWillBeSuccessful();

    aMockConfig();
    await notificationLambdaHandler(
      currentQuestionChangedEvent(),
      newContext()
    );
    expect(postToConnection).not.toHaveBeenCalled();
  });
  it("Should send new question to active connections", async () => {
    const { query, getItem } = aMockDynamo();
    query.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Items: [
            { sk: { S: `${connectionPrefix}1234` } },
            { sk: { S: `${connectionPrefix}5678` } }
          ]
        })
    });

    getItem.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Item: {
            markdown: { S: "Question string" }
          }
        })
    });
    const { postToConnection } = sendingToClientsWillBeSuccessful();
    aMockConfig();
    await notificationLambdaHandler(
      currentQuestionChangedEvent(),
      newContext()
    );
    expect(postToConnection).toHaveBeenCalledTimes(2);
  });

  it("Should delete a connection if something goes wrong sending to it", async () => {
    const { query, getItem, deleteItem } = aMockDynamo();
    query.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Items: [
            { sk: { S: `${connectionPrefix}1234` } },
            { sk: { S: `${connectionPrefix}5678` } }
          ]
        })
    });

    getItem.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Item: {
            markdown: { S: "Question string" }
          }
        })
    });
    const { postToConnection } = sendingToThelientWillFailAfterTheFirstTry();
    aMockConfig();
    await notificationLambdaHandler(
      currentQuestionChangedEvent(),
      newContext()
    );
    expect(postToConnection).toHaveBeenCalledTimes(2);
    expect(deleteItem).toHaveBeenCalledWith({
      TableName: testTableName,
      Key: {
        kid: { S: connectionKey },
        sk: { S: `${connectionPrefix}5678` }
      }
    });
  });
});

const sendingToClientsWillBeSuccessful = (): {
  postToConnection: jest.Mock;
} => {
  const postToConnection = jest.fn(() => ({
    promise: () => Promise.resolve("")
  }));
  ((ApiGatewayManagementApi as unknown) as jest.Mock).mockImplementation(
    () => ({
      postToConnection
    })
  );
  return { postToConnection };
};

const sendingToThelientWillFailAfterTheFirstTry = (): {
  postToConnection: jest.Mock;
} => {
  const postToConnection = jest.fn();
  postToConnection.mockImplementationOnce(() => ({
    promise: () => Promise.resolve("")
  }));
  postToConnection.mockImplementation(() => ({
    promise: () => {
      return Promise.reject("Something has gone wrong... On purpose");
    }
  }));

  ((ApiGatewayManagementApi as unknown) as jest.Mock).mockImplementation(
    () => ({
      postToConnection
    })
  );
  return { postToConnection };
};

const aMockDynamo = () => {
  const query = jest.fn();
  const getItem = jest.fn();
  const deleteItem = jest.fn();
  mockedDynamo.mockImplementation(() => {
    return {
      query,
      getItem,
      deleteItem
    };
  });

  return {
    query,
    getItem,
    deleteItem
  };
};

const newContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "name",
  functionVersion: "version",
  invokedFunctionArn: "",
  memoryLimitInMB: 1,
  logGroupName: "",
  awsRequestId: "",
  done: () => {},
  fail: () => {},
  succeed: () => {},
  logStreamName: "",
  getRemainingTimeInMillis: () => 0
});
const aMockConfig = () => {
  ((configProvider as unknown) as jest.Mock<Config>).mockImplementation(() => {
    return {
      tableName: testTableName
    };
  });
};
