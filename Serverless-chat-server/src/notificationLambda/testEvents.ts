import { DynamoDBStreamEvent } from "aws-lambda";
import { currentQuestionKey } from "./constants";
export const baseEvent = (dynamodb: any): DynamoDBStreamEvent => ({
  Records: [
    {
      eventID: "cb39508f58cb16325f901f2ddc2e5a07",
      eventName: "MODIFY",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "ap-southeast-2",
      dynamodb,
      eventSourceARN:
        "arn:aws:dynamodb:ap-southeast-2:624538342145:table/sam-socket-test-TriviaTable-1BSEFRY1LLJP0/stream/2019-12-07T08:27:17.385"
    }
  ]
});

export const breakEvent = (): DynamoDBStreamEvent => {
  const breakDynamodb = {
    ApproximateCreationDateTime: 1575754141,
    Keys: {
      kid: {
        S: currentQuestionKey
      },
      sk: {
        S: "-"
      }
    },
    NewImage: {
      question: {
        S: "1"
      },
      round: {
        S: "0"
      },
      break: {
        BOOL: true
      },
      kid: {
        S: "currentQuestion"
      },
      sk: {
        S: "-"
      }
    },
    SequenceNumber: "2235100000000008730164444",
    SizeBytes: 63,
    StreamViewType: "NEW_IMAGE"
  };
  return baseEvent(breakDynamodb);
};

export const currentQuestionChangedEvent = () => {
  const breakDynamodb = {
    ApproximateCreationDateTime: 1575754141,
    Keys: {
      kid: {
        S: currentQuestionKey
      },
      sk: {
        S: "-"
      }
    },
    NewImage: {
      question: {
        S: "1"
      },
      round: {
        S: "1"
      },
      break: {
        BOOL: false
      },
      kid: {
        S: currentQuestionKey
      },
      sk: {
        S: "-"
      }
    },
    SequenceNumber: "2235100000000008730164444",
    SizeBytes: 63,
    StreamViewType: "NEW_IMAGE"
  };
  return baseEvent(breakDynamodb);
};

export const newConnectionEvent = (): DynamoDBStreamEvent => ({
  Records: [
    {
      eventID: "d68b423012d5b3bce24751421a43e772",
      eventName: "INSERT",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "ap-southeast-2",
      dynamodb: {
        ApproximateCreationDateTime: 1575369045,
        Keys: {
          kid: {
            S: "connection:EH3k_c_zSwMCGqw="
          }
        },
        NewImage: {
          kid: {
            S: "connection:EH3k_c_zSwMCGqw="
          }
        },
        SequenceNumber: "3950500000000007790329561",
        SizeBytes: 60,
        StreamViewType: "NEW_IMAGE"
      },
      eventSourceARN:
        "arn:aws:dynamodb:ap-southeast-2:624538342145:table/sam-socket-test-TriviaTable-1379EFINODOOZ/stream/2019-12-02T10:32:59.139"
    }
  ]
});
