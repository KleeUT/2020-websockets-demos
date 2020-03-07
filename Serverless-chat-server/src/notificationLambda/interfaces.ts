export interface QuestionDynamoImage {
  question: {
    S: string;
  };
  round: {
    S: string;
  };
  break: {
    BOOL: boolean;
  };
  kid: {
    S: string;
  };
  sk: {
    S: string;
  };
}

export interface UpdatedQuestion {
  round: Number;
  question: Number;
  break: Boolean;
}

export interface UserFacingQuetion {
  title: String;
  body: String;
  break: Boolean;
}
