import ConversationItem from "@/Components/App/ConversationItem";
import GroupModal from "@/Components/App/GroupModal";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import { useEventBus } from "@/EventBus";
import { PencilSquareIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { router, usePage } from "@inertiajs/react";
import NewUserModal from "@/Components/App/NewUserModal";
import { useState } from "react";
import { useEffect } from "react";

const ChatLayout = ({ children }) => {
    const page = usePage();
    const currentUser = page.props.auth.user;
    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;

    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const { emit, on } = useEventBus();
    const [searchTerm, setSearchTerm] = useState("");
    const [showNewUserModal, setShowNewUserModal] = useState(false);

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setSearchTerm(search);
    };

    const filterBySearch = (list) =>
        list.filter((c) => c.name.toLowerCase().includes(searchTerm));

    const isUserOnline = (userId) => onlineUsers[userId];

    const messageCreated = (message) => {
        setLocalConversations((oldUsers) => {
            return oldUsers.map((u) => {
                // If the message is for user
                if (
                    message.receiver_id &&
                    !u.is_group &&
                    (u.id == message.sender_id || u.id == message.receiver_id)
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }
                // If the message is for group
                if (
                    message.group_id &&
                    u.is_group &&
                    u.id == message.group_id
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }
                return u;
            });
        });
    };

    const messageDeleted = ({ prevMessage }) => {
        if (!prevMessage) {
            return;
        }

        messageCreated(prevMessage);
    };

    const changeConversationStatus = (group) => {
        setLocalConversations((prevGrupos) =>
            prevGrupos.map((grupo) => {
                if (grupo.id === group.id && grupo.is_group) {
                    return {
                        ...grupo,
                        code_status: group.code_status,
                    };
                }
                return grupo;
            })
        );
    };

    useEffect(() => {
        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);
        const offChangeStatus = on("group.statusChanged", (group) => {
            changeConversationStatus(group);
        });
        const offModalShow = on("GroupModal.show", (group) => {
            setShowGroupModal(true);
        });
        const offGroupDelete = on("group.deleted", ({ id, name }) => {
            setLocalConversations((oldConversations) => {
                return oldConversations.filter((con) => con.id != id);
            });

            emit("toast.show", `Group "${name}" was deleted`);

            if (
                !selectedConversation ||
                (selectedConversation.is_group && selectedConversation.id == id)
            ) {
                router.visit(route("dashboard"));
            }
        });
        const offNewGroup = on("group.created", ({ message, group }) => {
            const newGroup = {
                ...group,
                is_group: true,
            };

            setLocalConversations((prevGrupos) => [...prevGrupos, newGroup]);
        });

        return () => {
            offCreated();
            offDeleted();
            offModalShow();
            offGroupDelete();
            offChangeStatus();
            offNewGroup();
        };
    }, [on]);

    useEffect(() => {
        setSortedConversations(
            localConversations.sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if (a.blocked_at) {
                    return 1;
                } else if (b.blocked_at) {
                    return -1;
                }
                if (a.last_message_date && b.last_message_date) {
                    return b.last_message_date.localeCompare(
                        a.last_message_date
                    );
                } else if (a.last_message_date) {
                    return -1;
                } else if (b.last_message_date) {
                    return 1;
                } else {
                    return 0;
                }
            })
        );
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        Echo.join("online")
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user])
                );

                setOnlineUsers((prevOnlineUsers) => {
                    return { ...prevOnlineUsers, ...onlineUsersObj };
                });
            })
            .joining((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updatedUsers = { ...prevOnlineUsers };
                    updatedUsers[user.id] = user;
                    return updatedUsers;
                });
            })
            .leaving((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updatedUsers = { ...prevOnlineUsers };
                    delete updatedUsers[user.id];
                    return updatedUsers;
                });
            })
            .error((error) => {
                console.error("error", error);
            });

        return () => {
            Echo.leave("online");
        };
    }, []);

    return (
        <>
            {((currentUser.is_admin || currentUser.is_asesor) && (
                <div className="flex-1 w-full flex overflow-auto">
                    <div
                        className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-slate-800 flex flex-col overflow-auto ${
                            selectedConversation ? "-ml-[100%] sm:ml-0" : ""
                        }`}
                    >
                        <div className="flex items-center justify-between py-2 px-3 text-xl font-medium text-gray-200">
                            My Conversations
                            <div
                                className="tooltip tooltip-left"
                                data-tip="Create new Group"
                            >
                                <button
                                    onClick={(ev) => setShowGroupModal(true)}
                                    className="text-gray-400 hover:text-gray-200"
                                >
                                    <PencilSquareIcon className="w-4 h-4 inline-block ml-2" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3">
                            <PrimaryButton
                                onClick={(ev) => setShowNewUserModal(true)}
                                className="w-full"
                            >
                                <UserPlusIcon className="h-5 w-5 mr-2" />
                                Add New User
                            </PrimaryButton>

                            <div className="p-1"></div>
                            <TextInput
                                onKeyUp={onSearch}
                                placeholder="Filter users and groups"
                                className="w-full"
                            />
                        </div>
                        <div className="flex-1 overflow-auto">
                            <div className="p-3">
                                {sortedConversations &&
                                    filterBySearch(
                                        sortedConversations.filter(
                                            (conversation) =>
                                                conversation.is_group
                                        )
                                    ).map((conversation) => (
                                        <ConversationItem
                                            key={`group_${conversation.id}`}
                                            conversation={conversation}
                                            online={
                                                !!isUserOnline(conversation.id)
                                            }
                                            selectedConversation={
                                                selectedConversation
                                            }
                                        />
                                    ))}
                            </div>
                            <div className="p-3">
                                Admins
                                {sortedConversations &&
                                    filterBySearch(
                                        sortedConversations.filter(
                                            (conversation) =>
                                                conversation.is_admin
                                        )
                                    ).map((conversation) => (
                                        <ConversationItem
                                            key={`admin_${conversation.id}`}
                                            conversation={conversation}
                                            online={
                                                !!isUserOnline(conversation.id)
                                            }
                                            selectedConversation={
                                                selectedConversation
                                            }
                                        />
                                    ))}
                            </div>

                            <div className="p-3">
                                Asesors
                                {sortedConversations &&
                                    filterBySearch(
                                        sortedConversations.filter(
                                            (conversation) =>
                                                conversation.is_asesor &&
                                                !conversation.is_admin
                                        )
                                    ).map((conversation) => (
                                        <ConversationItem
                                            key={`asesor_${conversation.id}`}
                                            conversation={conversation}
                                            online={
                                                !!isUserOnline(conversation.id)
                                            }
                                            selectedConversation={
                                                selectedConversation
                                            }
                                        />
                                    ))}
                            </div>

                            <div className="p-3">
                                users
                                {sortedConversations &&
                                    filterBySearch(
                                        sortedConversations.filter(
                                            (conversation) =>
                                                !conversation.is_group &&
                                                !conversation.is_admin &&
                                                !conversation.is_asesor
                                        )
                                    ).map((conversation) => (
                                        <ConversationItem
                                            key={`user_${conversation.id}`}
                                            conversation={conversation}
                                            online={
                                                !!isUserOnline(conversation.id)
                                            }
                                            selectedConversation={
                                                selectedConversation
                                            }
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-auto">
                        {children}
                    </div>
                </div>
            )) || (
                <div className="flex-1 flex flex-col overflow-auto">
                    {children}
                </div>
            )}

            <GroupModal
                show={showGroupModal}
                onClose={() => setShowGroupModal(false)}
            />
            <NewUserModal
                show={showNewUserModal}
                onClose={(ev) => setShowNewUserModal(false)}
            />
        </>
    );
};

export default ChatLayout;
