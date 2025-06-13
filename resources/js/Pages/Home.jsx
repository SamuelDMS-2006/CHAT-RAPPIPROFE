import ChatLayout from "@/Layouts/ChatLayout";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useRef, useState, useEffect, useCallback } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import ConversationHeader from "@/Components/App/ConversationHeader";
import MessageItem from "@/Components/App/MessageItem";
import MessageInput from "@/Components/App/MessageInput";
import { useEventBus } from "@/EventBus";
import AttachmentPreviewModal from "@/Components/App/AttachmentPreviewModal";
import { Head } from "@inertiajs/react";
import axios from "axios";
import Echo from "laravel-echo";

function Home({ selectedConversation = null, messages = null }) {
    const [localMessages, setLocalMessages] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [scrollFromBottom, setScrollFromBottom] = useState(0);
    const loadMoreIntersect = useRef(null);
    const messagesCtrRef = useRef(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({});
    const { on } = useEventBus();
    const currentUser = usePage().props.auth.user;
    const userIsInConversation = conversation?.users?.some(
        (user) => user.id === currentUser.id
    );
    const [replyTo, setReplyTo] = useState(null);

    useEffect(() => {
        setConversation(selectedConversation);
    }, [selectedConversation]);

    const messageCreated = (message) => {
        if (
            selectedConversation &&
            selectedConversation.is_group &&
            selectedConversation.id == message.group_id
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }
        if (
            selectedConversation &&
            selectedConversation.is_user &&
            (selectedConversation.id == message.sender_id ||
                selectedConversation.id == message.receiver_id)
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }
    };

    const messageDeleted = ({ message }) => {
        if (
            selectedConversation &&
            selectedConversation.is_group &&
            selectedConversation.id == message.group_id
        ) {
            setLocalMessages((prevMessages) => {
                return prevMessages.filter((m) => m.id !== message.id);
            });
        }
        if (
            selectedConversation &&
            selectedConversation.is_user &&
            (selectedConversation.id == message.sender_id ||
                selectedConversation.id == message.receiver_id)
        ) {
            setLocalMessages((prevMessages) => {
                return prevMessages.filter((m) => m.id !== message.id);
            });
        }
    };

    const loadMoreMessages = useCallback(() => {
        if (noMoreMessages) {
            return;
        }

        // Find the first message object
        const firstMessage = localMessages[0];
        axios
            .get(route("message.loadOlder", firstMessage.id))
            .then(({ data }) => {
                if (data.data.length === 0) {
                    setNoMoreMessages(true);
                    return;
                }
                const scrollHeight = messagesCtrRef.current.scrollHeight;
                const scrollTop = messagesCtrRef.current.scrollTop;
                const clientHeight = messagesCtrRef.current.clientHeight;
                const tmpScrollFromBottom =
                    scrollHeight - scrollTop - clientHeight;
                console.log("tmpScrollFromBottom ", tmpScrollFromBottom);
                setScrollFromBottom(scrollHeight - scrollTop - clientHeight);

                setLocalMessages((prevMessages) => {
                    return [...data.data.reverse(), ...prevMessages];
                });
            });
    }, [localMessages, noMoreMessages]);

    const onAttachmentClick = (attachments, ind) => {
        setPreviewAttachment({
            attachments,
            ind,
        });
        setShowAttachmentPreview(true);
    };

    const changeAsesor = (group) => {
        setConversation((prev) => {
            return {
                ...prev,
                users: group.users,
                asesor: group.asesor,
            };
        });
    };

    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop =
                    messagesCtrRef.current.scrollHeight;
            }
        }, 10);

        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);
        const offChangeAsesor = on("group.asesorChanged", (group) => {
            changeAsesor(group);
        });

        setScrollFromBottom(0);

        setNoMoreMessages(false);

        return () => {
            offCreated();
            offDeleted();
            offChangeAsesor();
        };
    }, [selectedConversation]);

    useEffect(() => {
        setLocalMessages(messages ? messages.data.reverse() : []);
    }, [messages]);

    useEffect(() => {
        if (messagesCtrRef.current && scrollFromBottom !== null) {
            messagesCtrRef.current.scrollTop =
                messagesCtrRef.current.scrollHeight -
                messagesCtrRef.current.offsetHeight -
                scrollFromBottom;
        }

        if (noMoreMessages) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach(
                    (entry) => entry.isIntersecting && loadMoreMessages()
                ),
            {
                rootMargin: "0px 0px 250px 0px",
            }
        );

        if (loadMoreIntersect.current) {
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }

        return () => {
            observer.disconnect();
        };
    }, [localMessages]);

    useEffect(() => {
        if (!messages && !(currentUser.is_admin || currentUser.is_asesor)) {
            window.location.href = `/group/${currentUser.group_asigned}`;
        }
    }, [messages, currentUser]);

    useEffect(() => {
        const offReply = on("message.reply", ({ message }) => setReplyTo(message));
        return () => offReply();
    }, [on]);

    const handleReact = async (messageId, emoji) => {
        setLocalMessages((prev) =>
            prev.map((msg) =>
                msg.id === messageId
                    ? { ...msg, reacting: true }
                    : msg
            )
        );
        try {
            if (emoji === null) {
                await axios.delete(`/messages/${messageId}/react`);
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                reactions: (msg.reactions || []).filter(r => r.user_id !== currentUser.id),
                                reacting: false
                            }
                            : msg
                    )
                );
            } else {
                const res = await axios.post(`/messages/${messageId}/react`, { reaction: emoji });
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                reactions: [
                                    ...(msg.reactions || []).filter(r => r.user_id !== currentUser.id),
                                    res.data.reaction
                                ],
                                reacting: false
                            }
                            : msg
                    )
                );
            }
        } catch {
            setLocalMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId
                        ? { ...msg, reacting: false }
                        : msg
                )
            );
        }
    };

    useEffect(() => {
    if (!window.Echo || !localMessages.length) return;

        // Suscríbete a todos los mensajes visibles
        const channels = localMessages.map(msg =>
            window.Echo.private(`chat.message.${msg.id}`)
                .listen('MessageReacted', (e) => {
                    setLocalMessages(prev =>
                        prev.map(m => {
                            if (m.id !== e.reaction.message_id) return m;
                            let newReactions = (m.reactions || []).filter(r => r.user_id !== e.reaction.user.id);
                            if (e.reaction.action === "add") {
                                newReactions.push({
                                    id: e.reaction.id,
                                    user_id: e.reaction.user.id,
                                    reaction: e.reaction.emoji,
                                });
                            }
                            return { ...m, reactions: newReactions };
                        })
                    );
                })
        );

        return () => {
            channels.forEach(channel => channel.stopListening('MessageReacted'));
        };
    }, [localMessages]);

    return (
        <>
            {!messages ? (
                currentUser.is_admin || currentUser.is_asesor ? (
                    <div className="flex flex-col gap-8 justify-center items-center text-center h-full opacity-35">
                        <div className="text-2xl md:text-4xl p-16 text-slate-200">
                            Please select a conversation to see messages
                        </div>
                        <ChatBubbleLeftRightIcon className="w-32 h-32 inline-block" />
                    </div>
                ) : (
                    <></>
                )
            ) : (
                <>
                    {currentUser.is_admin || currentUser.is_asesor ? (
                        userIsInConversation ? (
                            <ConversationHeader
                                selectedConversation={selectedConversation}
                                onGroup={true}
                            />
                        ) : (
                            <ConversationHeader
                                selectedConversation={selectedConversation}
                                onGroup={false}
                            />
                        )
                    ) : (
                        <div></div>
                    )}
                    {selectedConversation.is_group ? (
                        userIsInConversation ? (
                            <>
                                <div
                                    ref={messagesCtrRef}
                                    className="flex-1 overflow-y-auto p-5"
                                >
                                    {localMessages.length === 0 ? (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="text-lg text-slate-200">
                                                No messages found
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col">
                                            <div ref={loadMoreIntersect}></div>
                                            {localMessages.map((message) => (
                                                <MessageItem
                                                    key={message.id}
                                                    message={message}
                                                    attachmentClick={
                                                        onAttachmentClick
                                                    }
                                                    onReply={setReplyTo}
                                                    onReact={handleReact}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <MessageInput 
                                    conversation={selectedConversation}
                                    replyTo={replyTo}
                                    onCancelReply={() => setReplyTo(null)}
                                />
                            </>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-lg text-slate-200">
                                    No perteneces al grupo
                                </div>
                            </div>
                        )
                    ) : (
                        <div
                            ref={messagesCtrRef}
                            className="flex-1 overflow-y-auto p-5"
                        >
                            {localMessages.length === 0 ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="text-lg text-slate-200">
                                        No messages found
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div ref={loadMoreIntersect}></div>
                                    {localMessages.map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            attachmentClick={onAttachmentClick}
                                            onReact={handleReact}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedConversation.is_group ? (
                        userIsInConversation ? (
                            <MessageInput conversation={conversation} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
                        ) : (
                            <div></div>
                        )
                    ) : (
                        <MessageInput conversation={conversation} replyTo={replyTo} onCancelReply={() => setReplyTo(null)}/>
                    )}
                </>
            )}

            {previewAttachment.attachments && (
                <AttachmentPreviewModal
                    attachments={previewAttachment.attachments}
                    index={previewAttachment.ind}
                    show={showAttachmentPreview}
                    onClose={() => setShowAttachmentPreview(false)}
                />
            )}
        </>
    );
}

Home.layout = (page) => {
    return (
        <AuthenticatedLayout user={page.props.auth.user}>
            <Head title="Inicio" />
            <ChatLayout children={page} />
        </AuthenticatedLayout>
    );
};

export default Home;
