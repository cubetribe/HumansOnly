"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, MenuItem, Select, Switch, TextField } from "@mui/material";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "@/app/(twitter)/layout";
import {
    getAdminUsers,
    getBlockedUsers,
    getModerationReports,
    getMutedUsers,
    getUserPrivacyPreferences,
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

    const { data: moderationReportsData, isLoading: isReportsLoading } = useQuery({
        queryKey: ["settings", "moderation-reports"],
        queryFn: () => getModerationReports("open", 30),
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

    const preferences = preferenceData?.preferences || { isPrivate: false, messagePrivacy: "everyone" };
    const blockedUsers = blockedData?.users || [];
    const mutedUsers = mutedData?.users || [];
    const adminUsers = adminUsersData?.users || [];
    const moderationReports = moderationReportsData?.reports || [];

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
