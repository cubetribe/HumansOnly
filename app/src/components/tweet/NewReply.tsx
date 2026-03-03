import { useState } from "react";
import { TextField, Avatar } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaRegImage, FaRegSmile } from "react-icons/fa";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Link from "next/link";

import CircularLoading from "../misc/CircularLoading";
import { createReply, prepareHumanContext } from "@/utilities/fetch";
import Uploader from "../misc/Uploader";
import { getFullURL } from "@/utilities/misc/getFullURL";
import { uploadFile } from "@/utilities/storage";
import { UserProps } from "@/types/UserProps";
import { TweetProps } from "@/types/TweetProps";
import ProgressCircle from "../misc/ProgressCircle";
import TurnstileChallenge from "../human/TurnstileChallenge";

export default function NewReply({ token, tweet }: { token: UserProps; tweet: TweetProps }) {
    const [showPicker, setShowPicker] = useState(false);
    const [showDropzone, setShowDropzone] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [count, setCount] = useState(0);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [challengeToken, setChallengeToken] = useState<string | null>(null);
    const [challengeNonce, setChallengeNonce] = useState(0);

    const queryClient = useQueryClient();

    const queryKey = ["tweets", tweet.author.username, tweet.id];

    const mutation = useMutation({
        mutationFn: (reply: { text: string; photoUrl?: string; challengeSessionId?: string; ruleVersion?: string }) =>
            createReply(reply, tweet.author.username, tweet.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey });
        },
        onError: (error) => console.log(error),
    });

    const handlePhotoChange = (file: File) => {
        setPhotoFile(file);
    };

    const validationSchema = yup.object({
        text: yup
            .string()
            .max(280, "Reply text should be of maximum 280 characters length.")
            .required("Reply text can't be empty."),
    });

    const formik = useFormik({
        initialValues: {
            text: "",
            photoUrl: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitError(null);
                const humanContext = await prepareHumanContext({
                    action: "reply_create",
                    challengeToken: challengeToken || undefined,
                });

                if (photoFile) {
                    const path: string | void = await uploadFile(photoFile);
                    if (!path) throw new Error("Error uploading image.");
                    values.photoUrl = path;
                    setPhotoFile(null);
                }

                const result = await mutation.mutateAsync({
                    text: values.text.trim(),
                    photoUrl: values.photoUrl || undefined,
                    challengeSessionId: humanContext.challengeSessionId,
                    ruleVersion: humanContext.ruleVersion,
                });

                if (result.pendingReview) {
                    setSubmitError(result.message || "Reply queued for authenticity review.");
                }

                resetForm();
                setShowDropzone(false);
                setCount(0);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Could not publish reply.";
                setSubmitError(message);
            } finally {
                setChallengeToken(null);
                setChallengeNonce((current) => current + 1);
            }
        },
    });

    const customHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCount(e.target.value.length);
        formik.handleChange(e);
    };

    if (formik.isSubmitting) {
        return <CircularLoading />;
    }

    return (
        <div className="new-tweet-form new-reply">
            <Avatar
                className="avatar div-link"
                sx={{ width: 50, height: 50 }}
                alt=""
                src={token.photoUrl ? getFullURL(token.photoUrl) : "/assets/egg.jpg"}
            />
            <form onSubmit={formik.handleSubmit}>
                <div className="input">
                    <TextField
                        placeholder="Post your reply"
                        multiline
                        minRows={1}
                        variant="standard"
                        fullWidth
                        name="text"
                        value={formik.values.text}
                        onChange={customHandleChange}
                        error={formik.touched.text && Boolean(formik.errors.text)}
                        helperText={formik.touched.text && formik.errors.text}
                        hiddenLabel
                    />
                </div>
                <div className="input-additions">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowDropzone(true);
                        }}
                        className="icon-hoverable"
                    >
                        <FaRegImage />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPicker(!showPicker);
                        }}
                        className="icon-hoverable"
                    >
                        <FaRegSmile />
                    </button>
                    <ProgressCircle maxChars={280} count={count} />
                    <button className={`btn ${formik.isValid ? "" : "disabled"}`} disabled={!formik.isValid} type="submit">
                        Reply
                    </button>
                </div>
                {showPicker && (
                    <div className="emoji-picker">
                        <Picker
                            data={data}
                            onEmojiSelect={(emoji: any) => {
                                formik.setFieldValue("text", formik.values.text + emoji.native);
                                setShowPicker(false);
                            }}
                            previewPosition="none"
                        />
                    </div>
                )}
                {showDropzone && <Uploader handlePhotoChange={handlePhotoChange} />}
                {
                    <Link className="reply-to" href={`/${tweet.author.username}`}>
                        Replying to <span className="mention">@{tweet.author.username}</span>
                    </Link>
                }
                <TurnstileChallenge
                    action="reply_create"
                    nonce={challengeNonce}
                    onTokenChange={setChallengeToken}
                />
                {submitError && <p className="text-muted">{submitError}</p>}
            </form>
        </div>
    );
}
