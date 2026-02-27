import { NotificationContent, NotificationTypes } from "@/types/NotificationProps";

const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL;

export const getAllTweets = async (page = "1") => {
    const response = await fetch(`${HOST_URL}/api/tweets/all?page=${page}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getRelatedTweets = async () => {
    const response = await fetch(`${HOST_URL}/api/tweets/related`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserTweets = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserLikes = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/likes`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserMedia = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/media`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserReplies = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/replies`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserTweet = async (tweetId: string, tweetAuthor: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const createTweet = async (tweet: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/create`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: tweet,
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const logIn = async (candidate: string) => {
    const response = await fetch(`${HOST_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: candidate,
    });
    return response.json();
};

export const logInAsTest = async () => {
    const testAccount = {
        username: "test",
        password: "123456789",
    };
    return await logIn(JSON.stringify(testAccount));
};

export const logout = async () => {
    await fetch(`${HOST_URL}/api/auth/logout`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
};

export const createUser = async (newUser: string) => {
    const response = await fetch(`${HOST_URL}/api/users/create`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: newUser,
    });
    return response.json();
};

export const getUser = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/${username}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const editUser = async (updatedUser: string, username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/${username}/edit`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: updatedUser,
    });
    return response.json();
};

export const updateTweetLikes = async (tweetId: string, tweetAuthor: string, isLiked: boolean) => {
    const route = isLiked ? "unlike" : "like";
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/${route}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const updateReposts = async (tweetId: string, tweetAuthor: string, isReposted: boolean) => {
    const route = isReposted ? "unretweet" : "retweet";
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/${route}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const updateUserFollows = async (followedUsername: string, isFollowed: boolean) => {
    const route = isFollowed ? "unfollow" : "follow";
    const response = await fetch(`${HOST_URL}/api/users/${followedUsername}/${route}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const deleteTweet = async (tweetId: string, tweetAuthor: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/delete`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const createReply = async (reply: string, tweetAuthor: string, tweetId: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/reply`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: reply,
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getReplies = async (tweetAuthor: string, tweetId: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/reply`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const search = async (text: string) => {
    const response = await fetch(`${HOST_URL}/api/search?q=${text}`, {
        credentials: "include",
    });
    return response.json();
};

export const getRandomThreeUsers = async () => {
    const response = await fetch(`${HOST_URL}/api/users/random`, {
        credentials: "include",
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const createMessage = async (message: string) => {
    const response = await fetch(`${HOST_URL}/api/messages/create`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: message,
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getUserMessages = async (username: string, page = "1", limit = "20") => {
    const response = await fetch(`${HOST_URL}/api/messages/${username}?page=${page}&limit=${limit}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const checkUserExists = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/exists?q=${username}`, {
        credentials: "include",
    });
    return response.json();
};

export const deleteConversation = async (participants: string[]) => {
    const response = await fetch(`${HOST_URL}/api/messages/delete`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ participants }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const markMessagesRead = async (messagedUsername: string) => {
    const response = await fetch(`${HOST_URL}/api/messages/read`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messagedUsername }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getNotificationsPage = async (page = "1", limit = "50") => {
    const response = await fetch(`${HOST_URL}/api/notifications?page=${page}&limit=${limit}`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getNotifications = async () => getNotificationsPage();

export const createNotification = async (
    recipient: string,
    type: NotificationTypes,
    secret: string,
    notificationContent: NotificationContent = null
) => {
    const response = await fetch(`${HOST_URL}/api/notifications/create`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient, type, secret, notificationContent }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const markNotificationsRead = async () => {
    const response = await fetch(`${HOST_URL}/api/notifications/read`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const getNotificationPreferences = async () => {
    const response = await fetch(`${HOST_URL}/api/notifications/preferences`, {
        credentials: "include",
        next: {
            revalidate: 0,
        },
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};

export const updateNotificationPreferences = async (
    preferences: Partial<{ like: boolean; reply: boolean; follow: boolean; retweet: boolean; message: boolean }>
) => {
    const response = await fetch(`${HOST_URL}/api/notifications/preferences`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message ? json.message : "Something went wrong.");
    return json;
};
