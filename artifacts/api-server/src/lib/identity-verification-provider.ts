export type ChallengeStartResult = {
  challengeId: string;
  maskedPhone: string;
  expiresInSeconds: number;
  demoOtp?: string;
  smsSent?: boolean;
  smsProvider?: string;
  smsNotice?: string;
};

export type ChallengeVerificationResult = {
  verified: boolean;
  displayName: string;
  provider: "mock";
};

export interface IdentityVerificationProvider {
  startChallenge(
    idNumber: string,
    phoneNumber?: string,
  ): Promise<ChallengeStartResult> | ChallengeStartResult;
  verifyChallenge(
    challengeId: string,
    otp: string,
  ): ChallengeVerificationResult;
}

export class IdentityVerificationError extends Error {
  constructor(
    readonly statusCode: 400 | 404 | 429,
    message: string,
  ) {
    super(message);
    this.name = "IdentityVerificationError";
  }
}
