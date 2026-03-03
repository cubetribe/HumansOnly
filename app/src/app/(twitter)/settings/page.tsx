"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, MenuItem, Select, Switch, TextField } from "@mui/material";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "@/app/(twitter)/layout";
import {
    getAdminAnalyticsKpis,
    getAdminUsers,
    getAuthenticityAppeals,
    getBlockedUsers,
    getAuthenticityChecks,
    getMyAuthenticityAppeals,
    getMyAuthenticityChecks,
    getModerationReports,
    getMutedUsers,
    getUserPrivacyPreferences,
    decideAuthenticityAppeal,
    decideAuthenticityCheck,
    submitAuthenticityAppeal,
    updateReportStatus,
    updateUserRole,
    updateUserBlock,
    updateUserMute,
    updateUserPrivacyPreferences,
} from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { UserProps } from "@/types/UserProps";
import { getFullURL } from "@/utilities/misc/getFullURL";
import { UserRole } from "@/types/Role";

export default function SettingsPage() {
    const { token } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const queryClient = useQueryClient();

    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [adminSearch, setAdminSearch] = useState("");

    const { data: preferenceData, isLoading: isPreferenceLoading } = useQuery({
        queryKey: ["settings", "privacy"],
        queryFn: getUserPrivacyPreferences,
    });

    const { data: blockedData, isLoading: isBlockedLoading } = useQuery({
        queryKey: ["settings", "blocked"],
        queryFn: getBlockedUsers,
    });

    const { data: mutedData, isLoading: isMutedLoading } = useQuery({
        queryKey: ["settings", "muted"],
        queryFn: getMutedUsers,
    });

    const isAdminUser = token?.role === "admin";
    const isSuperAdmin = Boolean(token?.isSuperAdmin);
    const canModerate = token?.role === "admin" || token?.role === "moderator";

    const { data: adminUsersData, isLoading: isAdminUsersLoading } = useQuery({
        queryKey: ["settings", "admin-users", adminSearch],
        queryFn: () => getAdminUsers(adminSearch, 50),
        enabled: isAdminUser,
    });

    const {
        data: adminAnalyticsData,
        isLoading: isAdminAnalyticsLoading,
        isError: isAdminAnalyticsError,
    } = useQuery({
        queryKey: ["settings", "admin-analytics-kpis"],
        queryFn: () => getAdminAnalyticsKpis(7),
        enabled: isAdminUser,
    });

    const { data: moderationReportsData, isLoading: isReportsLoading } = useQuery({
        queryKey: ["settings", "moderation-reports"],
        queryFn: () => getModerationReports("open", 30),
        enabled: canModerate,
    });

    const { data: authenticityChecksData, isLoading: isAuthenticityChecksLoading } = useQuery({
        queryKey: ["settings", "authenticity-checks"],
        queryFn: () => getAuthenticityChecks("open", 30),
        enabled: canModerate,
    });

    const { data: myAuthenticityChecksData, isLoading: isMyAuthenticityChecksLoading } = useQuery({
        queryKey: ["settings", "my-authenticity-checks"],
        queryFn: () => getMyAuthenticityChecks("all", 30),
    });

    const { data: myAppealsData, isLoading: isMyAppealsLoading } = useQuery({
        queryKey: ["settings", "my-authenticity-appeals"],
        queryFn: getMyAuthenticityAppeals,
    });

    const { data: moderationAppealsData, isLoading: isModerationAppealsLoading } = useQuery({
        queryKey: ["settings", "moderation-authenticity-appeals"],
        queryFn: () => getAuthenticityAppeals("open", 30),
        enabled: canModerate,
    });

    const updatePreferencesMutation = useMutation({
        mutationFn: updateUserPrivacyPreferences,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "privacy"] });
            setSnackbar({
                message: "Preferences updated.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to update preferences.",
                severity: "error",
                open: true,
            });
        },
    });

    const unblockMutation = useMutation({
        mutationFn: (username: string) => updateUserBlock(username, true),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "blocked"] });
            await queryClient.invalidateQueries({ queryKey: ["users"] });
            setSnackbar({
                message: "User unblocked.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to unblock user.",
                severity: "error",
                open: true,
            });
        },
    });

    const unmuteMutation = useMutation({
        mutationFn: (username: string) => updateUserMute(username, true),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "muted"] });
            await queryClient.invalidateQueries({ queryKey: ["users"] });
            setSnackbar({
                message: "User unmuted.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to unmute user.",
                severity: "error",
                open: true,
            });
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({ username, role }: { username: string; role: UserRole }) => updateUserRole(username, role),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "admin-users"] });
            setSnackbar({
                message: "User role updated.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to update role.",
                severity: "error",
                open: true,
            });
        },
    });

    const reportStatusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: string; status: "open" | "reviewing" | "resolved" | "rejected" }) =>
            updateReportStatus(reportId, status),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "moderation-reports"] });
            setSnackbar({
                message: "Report status updated.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to update report status.",
                severity: "error",
                open: true,
            });
        },
    });

    const authenticityDecisionMutation = useMutation({
        mutationFn: ({ checkId, decision }: { checkId: string; decision: "allow" | "reject" | "strike" }) =>
            decideAuthenticityCheck(checkId, decision),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "authenticity-checks"] });
            await queryClient.invalidateQueries({ queryKey: ["tweets"] });
            setSnackbar({
                message: "Authenticity decision saved.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to save authenticity decision.",
                severity: "error",
                open: true,
            });
        },
    });

    const submitAppealMutation = useMutation({
        mutationFn: ({ checkId, reason }: { checkId: string; reason?: string }) => submitAuthenticityAppeal(checkId, reason),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "my-authenticity-checks"] });
            await queryClient.invalidateQueries({ queryKey: ["settings", "my-authenticity-appeals"] });
            await queryClient.invalidateQueries({ queryKey: ["settings", "moderation-authenticity-appeals"] });
            setSnackbar({
                message: "Appeal submitted.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to submit appeal.",
                severity: "error",
                open: true,
            });
        },
    });

    const appealDecisionMutation = useMutation({
        mutationFn: ({ appealId, decision }: { appealId: string; decision: "uphold" | "overturn_allow" }) =>
            decideAuthenticityAppeal(appealId, decision),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["settings", "moderation-authenticity-appeals"] });
            await queryClient.invalidateQueries({ queryKey: ["settings", "my-authenticity-checks"] });
            await queryClient.invalidateQueries({ queryKey: ["settings", "my-authenticity-appeals"] });
            await queryClient.invalidateQueries({ queryKey: ["settings", "authenticity-checks"] });
            await queryClient.invalidateQueries({ queryKey: ["tweets"] });
            setSnackbar({
                message: "Appeal decision saved.",
                severity: "success",
                open: true,
            });
        },
        onError: (error: Error) => {
            setSnackbar({
                message: error.message || "Failed to save appeal decision.",
                severity: "error",
                open: true,
            });
        },
    });

    const preferences = preferenceData?.preferences || { isPrivate: false, messagePrivacy: "everyone" };
    const blockedUsers = blockedData?.users || [];
    const mutedUsers = mutedData?.users || [];
    const adminUsers = adminUsersData?.users || [];
    const moderationReports = moderationReportsData?.reports || [];
    const authenticityChecks = authenticityChecksData?.checks || [];
    const myAuthenticityChecks = myAuthenticityChecksData?.checks || [];
    const myAppeals = myAppealsData?.appeals || [];
    const moderationAppeals = moderationAppealsData?.appeals || [];
    const analyticsEventCounts = adminAnalyticsData?.eventCounts || [];
    const analyticsActivitySummary = adminAnalyticsData?.activitySummary || {
        postsCreated: 0,
        repliesCreated: 0,
        activeUsers: 0,
    };

    const handleTogglePrivate = () => {
        updatePreferencesMutation.mutate({ isPrivate: !preferences.isPrivate });
    };

    const handleMessagePrivacyChange = (value: "everyone" | "followers") => {
        updatePreferencesMutation.mutate({ messagePrivacy: value });
    };

    if (isPreferenceLoading || isBlockedLoading || isMutedLoading) return <CircularLoading />;

    return (
        <main className="settings-page">
            <h1 className="page-name">Settings</h1>

            <section className="color-theme-switch">
                <h2>Color Theme</h2>
                <Switch checked={theme === "dark" ? true : false} onChange={toggleTheme} />
                <div className="label">{theme === "dark" ? "(Lights Out)" : "(Default)"}</div>
            </section>

            <section className="settings-section">
                <h2>Profile Privacy</h2>
                <div className="settings-row">
                    <span>Private account</span>
                    <Switch
                        checked={Boolean(preferences.isPrivate)}
                        onChange={handleTogglePrivate}
                        disabled={updatePreferencesMutation.isLoading}
                    />
                </div>
                <p className="text-muted">Private accounts only show posts to followers.</p>
            </section>

            <section className="settings-section">
                <h2>Messages</h2>
                <div className="settings-row">
                    <span>Who can message you</span>
                    <Select
                        size="small"
                        value={preferences.messagePrivacy}
                        onChange={(event) =>
                            handleMessagePrivacyChange(event.target.value as "everyone" | "followers")
                        }
                        disabled={updatePreferencesMutation.isLoading}
                    >
                        <MenuItem value="everyone">Everyone</MenuItem>
                        <MenuItem value="followers">Followers only</MenuItem>
                    </Select>
                </div>
            </section>

            <section className="settings-section">
                <h2>Blocked Users</h2>
                {blockedUsers.length === 0 ? (
                    <p className="text-muted">No blocked users.</p>
                ) : (
                    <div className="settings-user-list">
                        {blockedUsers.map((user: UserProps) => (
                            <div className="settings-user-row" key={`blocked-${user.id}`}>
                                <Link href={`/${user.username}`} className="settings-user-link">
                                    <Avatar
                                        sx={{ width: 36, height: 36 }}
                                        alt={user.username}
                                        src={user.photoUrl ? getFullURL(user.photoUrl) : "/assets/egg.jpg"}
                                    />
                                    <span>@{user.username}</span>
                                </Link>
                                <button
                                    className="btn btn-white"
                                    disabled={unblockMutation.isLoading}
                                    onClick={() => unblockMutation.mutate(user.username)}
                                >
                                    Unblock
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="settings-section">
                <h2>Muted Users</h2>
                {mutedUsers.length === 0 ? (
                    <p className="text-muted">No muted users.</p>
                ) : (
                    <div className="settings-user-list">
                        {mutedUsers.map((user: UserProps) => (
                            <div className="settings-user-row" key={`muted-${user.id}`}>
                                <Link href={`/${user.username}`} className="settings-user-link">
                                    <Avatar
                                        sx={{ width: 36, height: 36 }}
                                        alt={user.username}
                                        src={user.photoUrl ? getFullURL(user.photoUrl) : "/assets/egg.jpg"}
                                    />
                                    <span>@{user.username}</span>
                                </Link>
                                <button
                                    className="btn btn-white"
                                    disabled={unmuteMutation.isLoading}
                                    onClick={() => unmuteMutation.mutate(user.username)}
                                >
                                    Unmute
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="settings-section">
                <h2>My Authenticity Status</h2>
                {isMyAuthenticityChecksLoading ? (
                    <CircularLoading />
                ) : myAuthenticityChecks.length === 0 ? (
                    <p className="text-muted">No authenticity checks found for your account yet.</p>
                ) : (
                    <div className="moderation-report-list">
                        {myAuthenticityChecks.map(
                            (check: {
                                id: string;
                                action: string;
                                status: string;
                                decision: string;
                                score?: number | null;
                                trustedTier?: string | null;
                                contentText?: string | null;
                                appeals?: Array<{ id: string; status: string; decision?: string | null }>;
                            }) => {
                                const latestAppeal = Array.isArray(check.appeals) && check.appeals.length > 0 ? check.appeals[0] : null;
                                const canAppeal =
                                    check.status === "resolved" &&
                                    ["block", "reject", "strike"].includes(check.decision) &&
                                    !latestAppeal;

                                return (
                                    <div className="moderation-report-row" key={`my-auth-check-${check.id}`}>
                                        <div className="moderation-report-meta">
                                            <strong>
                                                {check.action} · decision: {check.decision}
                                            </strong>
                                            <span className="text-muted">
                                                Status: {check.status} · Risk score:{" "}
                                                {typeof check.score === "number" ? check.score.toFixed(3) : "n/a"} · Tier:{" "}
                                                {check.trustedTier || "unknown"}
                                            </span>
                                            {check.contentText ? (
                                                <span className="text-muted">{check.contentText}</span>
                                            ) : (
                                                <span className="text-muted">No text snapshot available.</span>
                                            )}
                                            {latestAppeal ? (
                                                <span className="text-muted">
                                                    Appeal: {latestAppeal.status}
                                                    {latestAppeal.decision ? ` (${latestAppeal.decision})` : ""}
                                                </span>
                                            ) : null}
                                        </div>
                                        {canAppeal ? (
                                            <button
                                                className="btn btn-white"
                                                disabled={submitAppealMutation.isLoading}
                                                onClick={() => {
                                                    const reason =
                                                        window.prompt(
                                                            "Appeal reason (optional, max 500 chars):",
                                                            "Please review this decision again."
                                                        ) || "";
                                                    submitAppealMutation.mutate({
                                                        checkId: check.id,
                                                        reason: reason.trim() || undefined,
                                                    });
                                                }}
                                            >
                                                Appeal
                                            </button>
                                        ) : (
                                            <span className="text-muted">No appeal action available</span>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </section>

            <section className="settings-section">
                <h2>My Appeals</h2>
                {isMyAppealsLoading ? (
                    <CircularLoading />
                ) : myAppeals.length === 0 ? (
                    <p className="text-muted">No appeals submitted yet.</p>
                ) : (
                    <div className="moderation-report-list">
                        {myAppeals.map(
                            (appeal: {
                                id: string;
                                status: string;
                                decision?: string | null;
                                reason?: string | null;
                                reviewerNote?: string | null;
                                check: { id: string; action: string; decision: string };
                            }) => (
                                <div className="moderation-report-row" key={`my-appeal-${appeal.id}`}>
                                    <div className="moderation-report-meta">
                                        <strong>
                                            Check {appeal.check.id.slice(0, 8)}… · {appeal.check.action}
                                        </strong>
                                        <span className="text-muted">
                                            Appeal status: {appeal.status}
                                            {appeal.decision ? ` · decision: ${appeal.decision}` : ""}
                                        </span>
                                        <span className="text-muted">
                                            Original moderation decision: {appeal.check.decision}
                                        </span>
                                        {appeal.reason ? <span className="text-muted">Reason: {appeal.reason}</span> : null}
                                        {appeal.reviewerNote ? (
                                            <span className="text-muted">Moderator note: {appeal.reviewerNote}</span>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {canModerate && (
                <section className="settings-section">
                    <h2>Moderation Queue</h2>
                    {isReportsLoading ? (
                        <CircularLoading />
                    ) : moderationReports.length === 0 ? (
                        <p className="text-muted">No open reports.</p>
                    ) : (
                        <div className="moderation-report-list">
                            {moderationReports.map(
                                (report: {
                                    id: string;
                                    reason: string;
                                    details?: string | null;
                                    status: "open" | "reviewing" | "resolved" | "rejected";
                                    targetUser?: { username: string } | null;
                                    targetTweet?: { id: string; author?: { username: string } | null } | null;
                                }) => (
                                    <div className="moderation-report-row" key={report.id}>
                                        <div className="moderation-report-meta">
                                            <strong>{report.reason}</strong>
                                            <span className="text-muted">
                                                {report.targetUser
                                                    ? `User: @${report.targetUser.username}`
                                                    : report.targetTweet
                                                    ? `Post: ${report.targetTweet.id.slice(0, 8)}… by @${
                                                          report.targetTweet.author?.username || "unknown"
                                                      }`
                                                    : "Unknown target"}
                                            </span>
                                            {report.details ? <span className="text-muted">{report.details}</span> : null}
                                        </div>
                                        <Select
                                            size="small"
                                            value={report.status}
                                            onChange={(event) =>
                                                reportStatusMutation.mutate({
                                                    reportId: report.id,
                                                    status: event.target.value as "open" | "reviewing" | "resolved" | "rejected",
                                                })
                                            }
                                            disabled={reportStatusMutation.isLoading}
                                        >
                                            <MenuItem value="open">Open</MenuItem>
                                            <MenuItem value="reviewing">Reviewing</MenuItem>
                                            <MenuItem value="resolved">Resolved</MenuItem>
                                            <MenuItem value="rejected">Rejected</MenuItem>
                                        </Select>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            )}

            {canModerate && (
                <section className="settings-section">
                    <h2>Authenticity Queue</h2>
                    {isAuthenticityChecksLoading ? (
                        <CircularLoading />
                    ) : authenticityChecks.length === 0 ? (
                        <p className="text-muted">No open authenticity checks.</p>
                    ) : (
                        <div className="moderation-report-list">
                            {authenticityChecks.map(
                                (check: {
                                    id: string;
                                    action: string;
                                    decision: string;
                                    score?: number | null;
                                    trustedTier?: string | null;
                                    actor: { username: string };
                                    contentText?: string | null;
                                }) => (
                                    <div className="moderation-report-row" key={`auth-check-${check.id}`}>
                                        <div className="moderation-report-meta">
                                            <strong>
                                                {check.action} · @{check.actor.username}
                                            </strong>
                                            <span className="text-muted">
                                                Risk score: {typeof check.score === "number" ? check.score.toFixed(3) : "n/a"} ·
                                                Tier: {check.trustedTier || "unknown"}
                                            </span>
                                            {check.contentText ? (
                                                <span className="text-muted">{check.contentText}</span>
                                            ) : (
                                                <span className="text-muted">No text snapshot available.</span>
                                            )}
                                        </div>
                                        <Select
                                            size="small"
                                            value=""
                                            displayEmpty
                                            onChange={(event) =>
                                                authenticityDecisionMutation.mutate({
                                                    checkId: check.id,
                                                    decision: event.target.value as "allow" | "reject" | "strike",
                                                })
                                            }
                                            disabled={authenticityDecisionMutation.isLoading}
                                        >
                                            <MenuItem value="" disabled>
                                                Decide…
                                            </MenuItem>
                                            <MenuItem value="allow">Allow</MenuItem>
                                            <MenuItem value="reject">Reject</MenuItem>
                                            <MenuItem value="strike">Strike</MenuItem>
                                        </Select>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            )}

            {canModerate && (
                <section className="settings-section">
                    <h2>Authenticity Appeals Queue</h2>
                    {isModerationAppealsLoading ? (
                        <CircularLoading />
                    ) : moderationAppeals.length === 0 ? (
                        <p className="text-muted">No open authenticity appeals.</p>
                    ) : (
                        <div className="moderation-report-list">
                            {moderationAppeals.map(
                                (appeal: {
                                    id: string;
                                    status: string;
                                    reason?: string | null;
                                    actor: { username: string };
                                    check: {
                                        id: string;
                                        action: string;
                                        decision: string;
                                        score?: number | null;
                                        trustedTier?: string | null;
                                        contentText?: string | null;
                                    };
                                }) => (
                                    <div className="moderation-report-row" key={`auth-appeal-${appeal.id}`}>
                                        <div className="moderation-report-meta">
                                            <strong>
                                                Appeal by @{appeal.actor.username} · check {appeal.check.id.slice(0, 8)}…
                                            </strong>
                                            <span className="text-muted">
                                                Check decision: {appeal.check.decision} · Risk:{" "}
                                                {typeof appeal.check.score === "number" ? appeal.check.score.toFixed(3) : "n/a"} ·
                                                Tier: {appeal.check.trustedTier || "unknown"}
                                            </span>
                                            <span className="text-muted">Appeal status: {appeal.status}</span>
                                            {appeal.reason ? <span className="text-muted">Reason: {appeal.reason}</span> : null}
                                            {appeal.check.contentText ? (
                                                <span className="text-muted">{appeal.check.contentText}</span>
                                            ) : (
                                                <span className="text-muted">No text snapshot available.</span>
                                            )}
                                        </div>
                                        <Select
                                            size="small"
                                            value=""
                                            displayEmpty
                                            onChange={(event) =>
                                                appealDecisionMutation.mutate({
                                                    appealId: appeal.id,
                                                    decision: event.target.value as "uphold" | "overturn_allow",
                                                })
                                            }
                                            disabled={appealDecisionMutation.isLoading}
                                        >
                                            <MenuItem value="" disabled>
                                                Resolve appeal…
                                            </MenuItem>
                                            <MenuItem value="uphold">Uphold moderation</MenuItem>
                                            <MenuItem value="overturn_allow">Overturn and allow</MenuItem>
                                        </Select>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            )}

            {isAdminUser && (
                <section className="settings-section">
                    <h2>Admin Analytics (7d)</h2>
                    {isAdminAnalyticsLoading ? (
                        <CircularLoading />
                    ) : isAdminAnalyticsError ? (
                        <p className="text-muted">Could not load analytics KPIs right now.</p>
                    ) : (
                        <>
                            <div className="settings-metrics-grid">
                                <div className="settings-metric-card">
                                    <strong>{analyticsActivitySummary.activeUsers}</strong>
                                    <span className="text-muted">Active users</span>
                                </div>
                                <div className="settings-metric-card">
                                    <strong>{analyticsActivitySummary.postsCreated}</strong>
                                    <span className="text-muted">Posts created</span>
                                </div>
                                <div className="settings-metric-card">
                                    <strong>{analyticsActivitySummary.repliesCreated}</strong>
                                    <span className="text-muted">Replies created</span>
                                </div>
                            </div>

                            {analyticsEventCounts.length === 0 ? (
                                <p className="text-muted">No product events in the selected window.</p>
                            ) : (
                                <div className="moderation-report-list">
                                    {analyticsEventCounts.map((row: { eventName: string; count: number }) => (
                                        <div className="moderation-report-row" key={`analytics-event-${row.eventName}`}>
                                            <div className="moderation-report-meta">
                                                <strong>{row.eventName}</strong>
                                                <span className="text-muted">Last 7 days</span>
                                            </div>
                                            <strong>{row.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            {isAdminUser && (
                <section className="settings-section">
                    <h2>Role Management</h2>
                    <p className="text-muted">
                        {isSuperAdmin
                            ? "Super admin mode: you can assign user, moderator, and admin roles."
                            : "Admin mode: you can manage users and moderators. Only super admins can modify admin roles."}
                    </p>
                    <TextField
                        size="small"
                        placeholder="Search by username or name"
                        value={adminSearch}
                        onChange={(event) => setAdminSearch(event.target.value)}
                    />
                    {isAdminUsersLoading ? (
                        <CircularLoading />
                    ) : (
                        <div className="settings-user-list">
                            {adminUsers.map((user: UserProps & { role: UserRole; isSuperAdmin?: boolean }) => {
                                const isCurrentUser = user.username === token?.username;
                                const isProtectedSuperAdmin = Boolean(user.isSuperAdmin);
                                const isAdminRoleProtected = !isSuperAdmin && user.role === "admin";
                                const isRoleSelectDisabled =
                                    roleMutation.isLoading || isCurrentUser || isProtectedSuperAdmin || isAdminRoleProtected;

                                return (
                                    <div className="settings-user-row" key={`admin-user-${user.id}`}>
                                        <Link href={`/${user.username}`} className="settings-user-link">
                                            <Avatar
                                                sx={{ width: 36, height: 36 }}
                                                alt={user.username}
                                                src={user.photoUrl ? getFullURL(user.photoUrl) : "/assets/egg.jpg"}
                                            />
                                            <span>
                                                @{user.username}
                                                {user.isSuperAdmin ? " · super admin" : ""}
                                            </span>
                                        </Link>
                                        <Select
                                            size="small"
                                            value={user.role}
                                            onChange={(event) =>
                                                roleMutation.mutate({
                                                    username: user.username,
                                                    role: event.target.value as UserRole,
                                                })
                                            }
                                            disabled={isRoleSelectDisabled}
                                        >
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="moderator">Moderator</MenuItem>
                                            {(isSuperAdmin || user.role === "admin") && <MenuItem value="admin">Admin</MenuItem>}
                                        </Select>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </main>
    );
}
