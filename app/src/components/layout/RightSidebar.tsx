"use client";

import { useContext } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

import { AuthContext } from "@/app/(twitter)/layout";
import Search from "../misc/Search";
import WhoToFollow from "../misc/WhoToFollow";
import CompleteProfileReminder from "../misc/CompleteProfileReminder";
import Legal from "../misc/Legal";

export default function RightSidebar() {
    const { token, isPending } = useContext(AuthContext);

    return (
        <aside className="right-sidebar">
            <div className="fixed">
                <Search />
                {token && <WhoToFollow />}
                {token && <CompleteProfileReminder token={token} />}
                {!isPending && !token && (
                    <div className="reminder">
                        <h1>Don&apos;t miss what&apos;s happening</h1>
                        <p>People on Humans Only are the first to know.</p>
                        <div className="reminder-buttons">
                            <SignInButton mode="modal">
                                <button className="btn btn-white" type="button">
                                    Log In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="btn btn-dark" type="button">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </div>
                    </div>
                )}
                <Legal />
            </div>
        </aside>
    );
}
