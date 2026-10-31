import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  IdentityVerificationError,
  type ChallengeStartResult,
  type ChallengeVerificationResult,
  type IdentityVerificationProvider,
} from "./identity-verification-provider";
import { parseEthiopianNumber, sendRealSmsOtp } from "./sms-service";

const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_CHALLENGES_PER_ID = 10;
const MAX_OTP_ATTEMPTS = 5;

const demoIdentities = new Map([
  ["DEMO-4821-7390", { displayName: "Demo User", maskedPhone: "+251 9•• ••• ••••" }],
  ["DEMO-1138-2406", { displayName: "Sample Citizen", maskedPhone: "+251 9•• ••• ••••" }],
]);

type Challenge = {
  salt: string;
  codeHash: string;
  displayName: string;
  expiresAt: number;
  attemptsRemaining: number;
};

type RateLimit = {
  count: number;
  resetsAt: number;
};

function hashOtp(salt: string, otp: string): string {
  return createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

export class MockIdentityVerificationProvider
  implements IdentityVerificationProvider
{
  private readonly challenges = new Map<string, Challenge>();
  private readonly rateLimits = new Map<string, RateLimit>();

  private pruneExpired(now: number): void {
    for (const [challengeId, challenge] of this.challenges) {
      if (challenge.expiresAt <= now) {
        this.challenges.delete(challengeId);
      }
    }

    for (const [idNumber, limit] of this.rateLimits) {
      if (limit.resetsAt <= now) {
        this.rateLimits.delete(idNumber);
      }
    }
  }

  async startChallenge(
    idNumber: string,
    phoneNumber?: string,
  ): Promise<ChallengeStartResult> {
    const normalizedId = idNumber.trim().toUpperCase();

    // Determine displayName and target phone
    let displayName = "Demo Citizen";
    let maskedPhone = "+251 9•• ••• ••••";
    let isRealSmsRequested = false;
    let targetPhone = "";

    if (phoneNumber && phoneNumber.trim().length > 0) {
      const phoneInfo = parseEthiopianNumber(phoneNumber.trim());
      if (!phoneInfo.valid) {
        throw new IdentityVerificationError(
          400,
          `Invalid phone number format: "${phoneNumber}". Ethiopian numbers should be 09... (Ethio Telecom) or 07... (Safaricom).`,
        );
      }
      maskedPhone = phoneInfo.masked;
      targetPhone = phoneInfo.formatted;
      displayName = `Citizen (${phoneInfo.carrier})`;
      isRealSmsRequested = true;
    } else {
      const identity = demoIdentities.get(normalizedId);
      if (!identity) {
        throw new IdentityVerificationError(
          404,
          "No matching demo identity. Try DEMO-4821-7390 or enter your real phone number below.",
        );
      }
      displayName = identity.displayName;
      maskedPhone = identity.maskedPhone;
    }

    const now = Date.now();
    this.pruneExpired(now);
    let limit = this.rateLimits.get(normalizedId);
    if (!limit || limit.resetsAt <= now) {
      limit = { count: 0, resetsAt: now + RATE_WINDOW_MS };
      this.rateLimits.set(normalizedId, limit);
    }

    if (limit.count >= MAX_CHALLENGES_PER_ID) {
      throw new IdentityVerificationError(
        429,
        "Too many verification codes requested. Try again later.",
      );
    }
    limit.count += 1;

    const challengeId = randomUUID();
    const demoOtp = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const salt = randomBytes(16).toString("hex");

    this.challenges.set(challengeId, {
      salt,
      codeHash: hashOtp(salt, demoOtp),
      displayName,
      expiresAt: now + CHALLENGE_LIFETIME_MS,
      attemptsRemaining: MAX_OTP_ATTEMPTS,
    });

    let smsSent = false;
    let smsProvider = "none";
    let smsNotice: string | undefined = undefined;

    if (isRealSmsRequested && targetPhone) {
      const smsResult = await sendRealSmsOtp({
        phone: targetPhone,
        otp: demoOtp,
        idNumber: normalizedId,
      });

      smsSent = smsResult.success;
      smsProvider = smsResult.provider;
      if (smsResult.success) {
        smsNotice = `Real SMS delivered to ${targetPhone} via SMSEthiopia (${smsResult.carrier})!`;
      } else {
        smsNotice = smsResult.error;
      }
    }

    return {
      challengeId,
      maskedPhone,
      expiresInSeconds: CHALLENGE_LIFETIME_MS / 1000,
      demoOtp,
      smsSent,
      smsProvider,
      smsNotice,
    };
  }

  verifyChallenge(
    challengeId: string,
    otp: string,
  ): ChallengeVerificationResult {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.expiresAt <= Date.now()) {
      this.challenges.delete(challengeId);
      throw new IdentityVerificationError(
        404,
        "This verification code has expired. Request a new one.",
      );
    }

    challenge.attemptsRemaining -= 1;
    const submittedHash = hashOtp(challenge.salt, otp);
    const matches = timingSafeEqual(
      Buffer.from(challenge.codeHash, "hex"),
      Buffer.from(submittedHash, "hex"),
    );

    if (!matches) {
      if (challenge.attemptsRemaining <= 0) {
        this.challenges.delete(challengeId);
        throw new IdentityVerificationError(
          429,
          "Too many incorrect attempts. Request a new code.",
        );
      }

      throw new IdentityVerificationError(
        400,
        "That verification code is incorrect. Try again.",
      );
    }

    this.challenges.delete(challengeId);
    return {
      verified: true,
      displayName: challenge.displayName,
      provider: "mock",
    };
  }
}

export const mockIdentityVerificationProvider =
  new MockIdentityVerificationProvider();
