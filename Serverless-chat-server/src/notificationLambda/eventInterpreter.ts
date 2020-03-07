import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import { currentQuestionKey } from "./constants";
import { UpdatedQuestion, QuestionDynamoImage } from "./interfaces";

enum EventType {
  QUESTION_CHANGE,
  OTHER
}
const determineEventType = (event: DynamoDBStreamEvent): EventType => {
  if (
    event.Records.some(
      record => record.eventName === "MODIFY" && isCurrentQuestionDynamoKey
    )
  ) {
    return EventType.QUESTION_CHANGE;
  }
  return EventType.OTHER;
};

const isCurrentQuestionDynamoKey = (record: DynamoDBRecord): boolean =>
  !!(
    record.dynamodb &&
    record.dynamodb.Keys &&
    record.dynamodb.Keys.kid &&
    record.dynamodb.Keys.kid.S &&
    record.dynamodb.Keys.kid.S === currentQuestionKey
  );

export const isItAQuestionUpdateEvent = (event: DynamoDBStreamEvent): boolean =>
  determineEventType(event) == EventType.QUESTION_CHANGE;

export const getNewQuestionInfoFrom = (
  event: DynamoDBStreamEvent
): UpdatedQuestion => {
  const questionUpdateRecord = <QuestionDynamoImage>(
    (<unknown>(
      (((event.Records.find(isCurrentQuestionDynamoKey) || {}).dynamodb || {})
        .NewImage || {})
    ))
  );
  return {
    round: Number(questionUpdateRecord.round.S),
    question: Number(questionUpdateRecord.question.S),
    break: questionUpdateRecord.break.BOOL
  };
};
