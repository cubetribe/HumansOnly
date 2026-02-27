"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, MenuItem, Select, Switch } from "@mui/material";

import { ThemeContext } from "@/app/providers";
import {
    getBlockedUsers,
    getMutedUsers,
    getUserPrivacyPreferences,
    updateUserBlock,
    updateUserMute,
    updateUserPrivacyPreferences,
} from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { UserProps } from "@/types/UserProps";
import { getFullURL } from "@/utilities/misc/getFullURL";

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const queryClient = useQueryClient();

    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

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

    const preferences = preferenceData?.preferences || { isPrivate: false, messagePrivacy: "everyone" };
    const blockedUsers = blockedData?.users || [];
    const mutedUsers = mutedData?.users || [];

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

            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </main>
    );
}
