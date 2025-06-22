import { usePage } from "@inertiajs/react";
import ReactMarkdown from "react-markdown";
import React from "react";
import UserAvatar from "./UserAvatar";
import { formatMessageDateLong } from "@/helpers";
import MessageAttachments from "./MessageAttachments";
import MessageOptionsDropdown from "./MessageOptionsDropdown";

const MessageItem = ({ message, attachmentClick, onReply, onReact }) => {
    const currentUser = usePage().props.auth.user;
    const isOwn = message.sender_id === currentUser.id;

    return (
        <div
            className={
                "chat z-5 " +
                (isOwn
                    ? "chat-end ml-auto max-w-[90%] sm:max-w-[60%]"
                    : "chat-start max-w-[90%] sm:max-w-[60%]")
            }
        >
            {<UserAvatar user={message.sender} />}

            <div className="chat-header">
                {message.sender_id !== currentUser.id
                    ? message.sender.name
                    : ""}
                <time className="text-xs opacity-50 ml-2">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>

            {message.reply_to && (
                <div className="bg-gray-800 p-2 rounded mb-1 text-xs text-gray-300 border-l-4 border-blue-400">
                    <span className="font-semibold">
                        {message.reply_to.sender?.name}:
                    </span>{" "}
                    <span className="italic">{message.reply_to.message}</span>
                </div>
            )}

            <div
                className={
                    "chat-bubble relative " +
                    (message.sender_id === currentUser.id
                        ? " chat-bubble-info"
                        : "") +
                    (message.attachments?.length > 0 &&
                        message.attachments.some(a => a.mimetype?.includes("pdf"))
                        ? " max-w-[30vw] min-w-[180px] w-[30vw] p-0"
                        : " w-full")
                }
            >
                <MessageOptionsDropdown
                    message={message}
                    currentUser={currentUser}
                    onReact={onReact}
                    position={isOwn ? "left" : "right"}
                />
                <div className="chat-message">
                    <div className="chat-message-content break-words whitespace-pre-line">
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                    <MessageAttachments
                        attachments={message.attachments}
                        attachmentClick={attachmentClick}
                    />
                </div>
            </div>

            {/* Reacciones */}
            {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-2 mt-1">
                    {message.reactions.map((r, idx) => (
                        <span
                            key={idx}
                            className={`bg-gray-700 rounded-full px-2 py-1 text-sm ${
                                r.user_id === currentUser.id
                                    ? "border border-blue-400 cursor-pointer"
                                    : ""
                            }`}
                            title={
                                r.user_id === currentUser.id
                                    ? "Eliminar mi reacción"
                                    : ""
                            }
                            onClick={() => {
                                if (
                                    r.user_id === currentUser.id &&
                                    typeof onReact === "function"
                                ) {
                                    onReact(message.id, null); // null para indicar eliminación
                                }
                            }}
                        >
                            {r.reaction}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MessageItem;
