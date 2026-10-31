import { Router, type IRouter } from "express";
import {
  StartMockChallengeBody,
  StartMockChallengeResponse,
  VerifyMockChallengeBody,
  VerifyMockChallengeResponse,
} from "@workspace/api-zod";
import {
  IdentityVerificationError,
} from "../lib/identity-verification-provider";
import { mockIdentityVerificationProvider } from "../lib/mock-identity-verification-provider";

const router: IRouter = Router();

router.post("/auth/mock/challenges", async (req, res): Promise<void> => {
  const parsed = StartMockChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid demo ID." });
    return;
  }

  try {
    const rawResult = await mockIdentityVerificationProvider.startChallenge(
      parsed.data.idNumber,
      parsed.data.phoneNumber,
    );
    const response = StartMockChallengeResponse.parse(rawResult);
    res.json(response);
  } catch (error) {
    if (error instanceof IdentityVerificationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/auth/mock/challenges/verify", (req, res): void => {
  const parsed = VerifyMockChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter the six-digit demo code." });
    return;
  }

  try {
    const response = VerifyMockChallengeResponse.parse(
      mockIdentityVerificationProvider.verifyChallenge(
        parsed.data.challengeId,
        parsed.data.otp,
      ),
    );
    res.json(response);
  } catch (error) {
    if (error instanceof IdentityVerificationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export default router;
