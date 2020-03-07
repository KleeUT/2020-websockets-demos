import {
  isItAQuestionUpdateEvent,
  getNewQuestionInfoFrom
} from "./eventInterpreter";
import {
  breakEvent,
  newConnectionEvent,
  currentQuestionChangedEvent
} from "./testEvents";
import { UpdatedQuestion } from "./interfaces";
describe(isItAQuestionUpdateEvent, () => {
  it("should identify a questionUpdateEvent", () => {
    expect(isItAQuestionUpdateEvent(breakEvent())).toBe(true);
  });

  it("should identify  something that is not a questionUpdateEvent", () => {
    expect(isItAQuestionUpdateEvent(newConnectionEvent())).toBe(false);
  });
});

describe(getNewQuestionInfoFrom, () => {
  it("should extract break info from event", () => {
    const result: UpdatedQuestion = getNewQuestionInfoFrom(breakEvent());
    const expected: UpdatedQuestion = {
      break: true,
      question: 1,
      round: 0
    };
    expect(result).toEqual(expected);
  });

  it("should extract question info from event", () => {
    const result: UpdatedQuestion = getNewQuestionInfoFrom(
      currentQuestionChangedEvent()
    );
    const expected: UpdatedQuestion = {
      break: false,
      question: 1,
      round: 1
    };
    expect(result).toEqual(expected);
  });
});
