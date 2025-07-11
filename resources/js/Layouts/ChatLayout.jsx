import ConversationItem from "@/Components/App/ConversationItem";
import GroupModal from "@/Components/App/GroupModal";
import TextInput from "@/Components/TextInput";
import { Menu, Transition } from "@headlessui/react";
import PrimaryButton from "@/Components/PrimaryButton";
import { useEventBus } from "@/EventBus";
import { PencilSquareIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { router, usePage } from "@inertiajs/react";
import NewUserModal from "@/Components/App/NewUserModal";
import { useState, useEffect, Fragment } from "react";

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
    const [codeStatusFilter, setCodeStatusFilter] = useState("all");

    const status = [
        { id: 1, name: "gris", color: "bg-gray-500" },
        { id: 2, name: "amarillo", color: "bg-yellow-500" },
        { id: 3, name: "verde", color: "bg-green-500" },
        { id: 4, name: "naranja", color: "bg-orange-500" },
        { id: 5, name: "rojo", color: "bg-red-500" },
    ];

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setSearchTerm(search);
    };

    const filterConversations = (list) => {
        let filteredList = list.filter((c) =>
            c.name.toLowerCase().includes(searchTerm)
        );

        if (codeStatusFilter !== "all") {
            filteredList = filteredList.filter((c) => {
                return !c.is_group || c.code_status == codeStatusFilter;
            });
        }

        return filteredList;
    };

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
                const aIsPriority = a.code_status == 1 || a.code_status == 2;
                const bIsPriority = b.code_status == 1 || b.code_status == 2;

                if (aIsPriority && !bIsPriority) return -1;
                if (!aIsPriority && bIsPriority) return 1;

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
                <div className="flex-1 w-full flex overflow-hidden">
                    <div
                        className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-slate-800 flex flex-col overflow-hidden ${
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

                            <Menu
                                as="div"
                                className="relative inline-block text-left w-full"
                            >
                                <Menu.Button
                                    className={`flex items-center rounded-full py-2 text-gray-100 hover:bg-black/30 w-full `}
                                >
                                    <div className="items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 w-full">
                                        Filtrar por estado
                                    </div>
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="top-10 right-0 w-full rounded-md bg-gray-800 shadow-lg z-50">
                                        <div className="px-1 py-1">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    className="form-radio text-indigo-600"
                                                    name="code_status_filter"
                                                    value="all"
                                                    checked={
                                                        codeStatusFilter ===
                                                        "all"
                                                    }
                                                    onChange={(e) =>
                                                        setCodeStatusFilter(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <span className="ml-2 text-sm">
                                                    Todos
                                                </span>
                                            </label>
                                            {status &&
                                                status.map((status) => (
                                                    <Menu.Item key={status.id}>
                                                        {({ active }) => (
                                                            <label className="items-center w-full inline-flex py-2">
                                                                <input
                                                                    type="radio"
                                                                    className="form-radio text-indigo-600"
                                                                    name="code_status_filter"
                                                                    value={`${status.id}`}
                                                                    checked={
                                                                        codeStatusFilter ===
                                                                        String(
                                                                            status.id
                                                                        )
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setCodeStatusFilter(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                                <span className="ml-2 text-sm">
                                                                    {
                                                                        status.name
                                                                    }
                                                                </span>
                                                            </label>
                                                        )}
                                                    </Menu.Item>
                                                ))}
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <div className="p-3">
                                {sortedConversations &&
                                    (() => {
                                        const filteredGroups =
                                            filterConversations(
                                                sortedConversations.filter(
                                                    (conversation) =>
                                                        conversation.is_group
                                                )
                                            );

                                        return filteredGroups.length > 0 ? (
                                            filteredGroups.map(
                                                (conversation) => (
                                                    <ConversationItem
                                                        key={`group_${conversation.id}`}
                                                        conversation={
                                                            conversation
                                                        }
                                                        online={
                                                            !!isUserOnline(
                                                                conversation.id
                                                            )
                                                        }
                                                        selectedConversation={
                                                            selectedConversation
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="text-gray-400 text-sm italic px-2">
                                                No encontrado
                                            </div>
                                        );
                                    })()}
                            </div>

                            <div className="p-3">
                                Admins
                                {sortedConversations &&
                                    (() => {
                                        const filteredAdmins =
                                            filterConversations(
                                                sortedConversations.filter(
                                                    (conversation) =>
                                                        conversation.is_admin
                                                )
                                            );

                                        return filteredAdmins.length > 0 ? (
                                            filteredAdmins.map(
                                                (conversation) => (
                                                    <ConversationItem
                                                        key={`admin_${conversation.id}`}
                                                        conversation={
                                                            conversation
                                                        }
                                                        online={
                                                            !!isUserOnline(
                                                                conversation.id
                                                            )
                                                        }
                                                        selectedConversation={
                                                            selectedConversation
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="text-gray-400 text-sm italic px-2">
                                                No encontrado
                                            </div>
                                        );
                                    })()}
                            </div>

                            <div className="p-3">
                                Asesores
                                {sortedConversations &&
                                    (() => {
                                        const filteredAdmins =
                                            filterConversations(
                                                sortedConversations.filter(
                                                    (conversation) =>
                                                        conversation.is_asesor &&
                                                        !conversation.is_admin
                                                )
                                            );

                                        return filteredAdmins.length > 0 ? (
                                            filteredAdmins.map(
                                                (conversation) => (
                                                    <ConversationItem
                                                        key={`asesor_${conversation.id}`}
                                                        conversation={
                                                            conversation
                                                        }
                                                        online={
                                                            !!isUserOnline(
                                                                conversation.id
                                                            )
                                                        }
                                                        selectedConversation={
                                                            selectedConversation
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="text-gray-400 text-sm italic px-2">
                                                No encontrado
                                            </div>
                                        );
                                    })()}
                            </div>

                            <div className="p-3">
                                Usuarios
                                {sortedConversations &&
                                    (() => {
                                        const filteredAdmins =
                                            filterConversations(
                                                sortedConversations.filter(
                                                    (conversation) =>
                                                        !conversation.is_group &&
                                                        !conversation.is_admin &&
                                                        !conversation.is_asesor
                                                )
                                            );

                                        return filteredAdmins.length > 0 ? (
                                            filteredAdmins.map(
                                                (conversation) => (
                                                    <ConversationItem
                                                        key={`user_${conversation.id}`}
                                                        conversation={
                                                            conversation
                                                        }
                                                        online={
                                                            !!isUserOnline(
                                                                conversation.id
                                                            )
                                                        }
                                                        selectedConversation={
                                                            selectedConversation
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="text-gray-400 text-sm italic px-2">
                                                No encontrado
                                            </div>
                                        );
                                    })()}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {children}
                    </div>
                </div>
            )) || (
                <div className="flex-1 flex flex-col overflow-hidden">
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
