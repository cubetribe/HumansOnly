"use client";

import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import Tweets from "@/components/tweet/Tweets";
import { getRelatedTweets } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import NothingToShow from "@/components/misc/NothingToShow";
import NewTweet from "@/components/tweet/NewTweet";
import { AuthContext } from "../layout";

export default function HomePage() {
    const { token, isPending } = useContext(AuthContext);

    const { isLoading, isError, data } = useQuery({
        queryKey: ["tweets", "home"],
        queryFn: () => getRelatedTweets(),
        enabled: !!token,
    });

    if (isPending) return <CircularLoading />;
    if (!token) {
        return (
            <main>
                <h1 className="page-name">Home</h1>
                <p className="text-muted">Sign in to see posts from people you follow.</p>
            </main>
        );
    }
    if (isLoading) return <CircularLoading />;
    if (isError || !data) {
        return (
            <main>
                <h1 className="page-name">Home</h1>
                <p className="text-muted">Could not load your home feed right now.</p>
            </main>
        );
    }

    return (
        <main>
            <h1 className="page-name">Home</h1>
            {token && <NewTweet token={token} />}
            {data && data.tweets.length === 0 && <NothingToShow />}
            <Tweets tweets={data.tweets} />
        </main>
    );
}
