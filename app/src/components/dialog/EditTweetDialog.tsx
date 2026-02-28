"use client";

import { useEffect, useState } from "react";
import { Dialog, TextField } from "@mui/material";

type EditTweetDialogProps = {
    open: boolean;
    initialText: string;
    onClose: () => void;
    onSave: (nextText: string) => void;
    isSaving?: boolean;
};

export default function EditTweetDialog({ open, initialText, onClose, onSave, isSaving = false }: EditTweetDialogProps) {
    const [text, setText] = useState(initialText);

    useEffect(() => {
        if (open) {
            setText(initialText);
        }
    }, [open, initialText]);

    const normalized = text.trim();
    const isValid = normalized.length > 0 && normalized.length <= 280;

    return (
        <Dialog className="dialog" open={open} onClose={isSaving ? undefined : onClose} maxWidth={"sm"} fullWidth>
            <div className="new-tweet-wrapper edit-tweet-wrapper">
                <h1 className="title">Edit Post</h1>
                <TextField
                    autoFocus
                    multiline
                    minRows={4}
                    maxRows={10}
                    fullWidth
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    helperText={`${normalized.length}/280`}
                />
                <div className="edit-tweet-actions">
                    <button className="btn btn-white" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </button>
                    <button className="btn btn-dark" onClick={() => onSave(normalized)} disabled={!isValid || isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
