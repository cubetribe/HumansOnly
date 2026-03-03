"use client";

import Link from "next/link";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext } from "@/app/(twitter)/layout";
import CircularLoading from "@/components/misc/CircularLoading";
import { getAdminAnalyticsKpis, getAdminUsers, getAuthenticityAppeals, getModerationReports } from "@/utilities/fetch";

export default function AdminPage() {
    const { token, isPending } = useContext(AuthContext);
    const isAdminUser = token?.role === "admin";

    const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
        queryKey: ["admin-page", "analytics"],
        queryFn: () => getAdminAnalyticsKpis(7),
        enabled: isAdminUser,
    });

    const { data: usersData, isLoading: isUsersLoading } = useQuery({
        queryKey: ["admin-page", "users"],
        queryFn: () => getAdminUsers("", 20),
        enabled: isAdminUser,
    });

    const { data: reportsData, isLoading: isReportsLoading } = useQuery({
        queryKey: ["admin-page", "reports"],
        queryFn: () => getModerationReports("open", 20),
        enabled: isAdminUser,
    });

    const { data: appealsData, isLoading: isAppealsLoading } = useQuery({
        queryKey: ["admin-page", "appeals"],
        queryFn: () => getAuthenticityAppeals("open", 20),
        enabled: isAdminUser,
    });

    if (isPending) return <CircularLoading />;

    if (!token || !isAdminUser) {
        return (
            <main className="admin-page">
                <h1 className="page-name">Admin</h1>
                <p className="text-muted">Admin access required.</p>
            </main>
        );
    }

    if (isAnalyticsLoading || isUsersLoading || isReportsLoading || isAppealsLoading) return <CircularLoading />;

    const activitySummary = analyticsData?.activitySummary || { activeUsers: 0, postsCreated: 0, repliesCreated: 0 };
    const healthFlags = analyticsData?.healthFlags;
    const users = usersData?.users || [];
    const openReports = reportsData?.reports || [];
    const openAppeals = appealsData?.appeals || [];

    return (
        <main className="admin-page">
            <h1 className="page-name">Admin Dashboard</h1>
            <p className="text-muted">Operational snapshot for moderation, trust, and growth signals.</p>

            <section className="admin-grid">
                <article className="admin-card">
                    <h2>7d Activity</h2>
                    <p>Active users: {activitySummary.activeUsers}</p>
                    <p>Posts created: {activitySummary.postsCreated}</p>
                    <p>Replies created: {activitySummary.repliesCreated}</p>
                </article>
                <article className="admin-card">
                    <h2>Moderation Queue</h2>
                    <p>Open reports: {openReports.length}</p>
                    <p>Open authenticity appeals: {openAppeals.length}</p>
                    <Link href="/settings" className="btn btn-white">
                        Open Moderation Settings
                    </Link>
                </article>
                <article className="admin-card">
                    <h2>KPI Health</h2>
                    <p>Active users healthy: {healthFlags?.activeUsersHealthy ? "yes" : "no"}</p>
                    <p>Posts healthy: {healthFlags?.postsCreatedHealthy ? "yes" : "no"}</p>
                    <p>Replies healthy: {healthFlags?.repliesCreatedHealthy ? "yes" : "no"}</p>
                </article>
            </section>

            <section className="admin-card">
                <h2>Recent Accounts</h2>
                {users.length === 0 ? (
                    <p className="text-muted">No users available.</p>
                ) : (
                    <div className="admin-user-list">
                        {users.slice(0, 10).map((user: { id: string; username: string; role: string; isSuperAdmin?: boolean }) => (
                            <div key={user.id} className="admin-user-row">
                                <Link href={`/${user.username}`}>@{user.username}</Link>
                                <span className="text-muted">
                                    {user.role}
                                    {user.isSuperAdmin ? " · super admin" : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

