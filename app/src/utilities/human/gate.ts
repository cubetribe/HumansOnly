import { AuthenticatedUser } from "@/utilities/auth/session";
import { consumeChallengeSession } from "@/utilities/human/challenge";
import { getHumanRuntimeConfig, HumanAction, isHumanEnforcementEnabled } from "@/utilities/human/config";
import { hasAcceptedCurrentPolicy } from "@/utilities/human/policy";
import { evaluateAuthenticityRisk, persistAuthenticityCheck } from "@/utilities/human/risk";
import { getUserTrustSnapshot } from "@/utilities/human/trust";

type GatePayload = {
    authUser: AuthenticatedUser;
    action: HumanAction;
    text?: string | null;
    hasMedia?: boolean;
    challengeSessionId?: string | null;
    ruleVersion?: string | null;
    tweetId?: string | null;
    mediaAssetId?: string | null;
    metadata?: Record<string, unknown>;
};

export type HumanGateFailureCode = "rules_not_accepted" | "challenge_required" | "challenge_invalid" | "challenge_misconfigured";

export const runHumanGate = async ({
    authUser,
    action,
    text,
    hasMedia = false,
    challengeSessionId,
    ruleVersion,
    tweetId,
    mediaAssetId,
    metadata,
}: GatePayload) => {
    const runtime = getHumanRuntimeConfig();
    if (!isHumanEnforcementEnabled()) {
        return {
            ok: true as const,
            policyVersion: runtime.policyVersion,
            policyAccepted: true,
            challengeSessionId: null,
            challengeScore: null,
            trust: { score: 1, tier: "high_trust", passkeyEnrolled: false, recentChallenges: 0, recentChallengeFailures: 0, strikes: 0 },
            risk: {
                score: 0,
                reasons: [],
                suggestedDecision: "allow" as const,
            },
            decision: "allow" as const,
            suggestedDecision: "allow" as const,
            authenticityCheckId: null as string | null,
            dryRun: runtime.dryRun,
        };
    }

    const policyState = await hasAcceptedCurrentPolicy(authUser.id, ruleVersion);
    if (!policyState.accepted && !runtime.dryRun) {
        return {
            ok: false as const,
            code: "rules_not_accepted" as HumanGateFailureCode,
            message: "Please accept the latest rules before posting.",
            policyVersion: policyState.policy.version,
        };
    }

    const challengeResult = await consumeChallengeSession({
        userId: authUser.id,
        action,
        challengeSessionId,
    });

    if (!challengeResult.ok) {
        return {
            ok: false as const,
            code: challengeResult.code,
            message: challengeResult.message,
            policyVersion: policyState.policy.version,
        };
    }

    const trustSnapshot = await getUserTrustSnapshot(authUser.id);
    if (!trustSnapshot) {
        return {
            ok: false as const,
            code: "challenge_invalid" as HumanGateFailureCode,
            message: "Trust profile could not be loaded.",
            policyVersion: policyState.policy.version,
        };
    }

    const risk = evaluateAuthenticityRisk({
        text,
        hasMedia,
        challengePresent: Boolean(challengeResult.session),
        challengeScore: challengeResult.session?.challengeScore,
        trustScore: trustSnapshot.score,
        trustTier: trustSnapshot.tier,
    });

    const check = await persistAuthenticityCheck({
        actorId: authUser.id,
        action,
        text,
        hasMedia,
        challengeSessionId: challengeResult.session?.id || null,
        challengeScore: challengeResult.session?.challengeScore ?? null,
        riskScore: risk.score,
        trustTier: trustSnapshot.tier,
        trustScore: trustSnapshot.score,
        suggestedDecision: risk.suggestedDecision,
        ruleVersion: policyState.policy.version,
        tweetId,
        mediaAssetId,
        metadata: {
            ...(metadata || {}),
            reasons: risk.reasons,
        },
    });

    const effectiveDecision = runtime.dryRun ? "allow" : risk.suggestedDecision;

    return {
        ok: true as const,
        policyVersion: policyState.policy.version,
        policyAccepted: policyState.accepted,
        challengeSessionId: challengeResult.session?.id || null,
        challengeScore: challengeResult.session?.challengeScore ?? null,
        trust: trustSnapshot,
        risk,
        decision: effectiveDecision,
        suggestedDecision: risk.suggestedDecision,
        authenticityCheckId: check.id,
        dryRun: runtime.dryRun,
    };
};
