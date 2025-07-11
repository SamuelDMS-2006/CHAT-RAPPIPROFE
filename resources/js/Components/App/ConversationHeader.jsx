import { Link, usePage } from "@inertiajs/react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import {
    UserIcon,
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";
import GroupDescriptionPopover from "./GroupDescriptionPopover";
import GroupUsersPopover from "./GroupUsersPopover";
import { useEventBus } from "@/EventBus";
import { use } from "react";

const ConversationHeader = ({ selectedConversation, onGroup }) => {
    const page = usePage();
    const currentUser = page.props.auth.user;
    const { asesores } = page.props.splitUsers;
    const { emit, on } = useEventBus();
    const [localConversations, setLocalConversations] =
        useState(selectedConversation);
    const [sortedAsesors, setSortedAsesors] = useState([]);

    const status = [
        { id: 1, name: "gris", color: "bg-gray-500" },
        { id: 2, name: "amarillo", color: "bg-yellow-500" },
        { id: 3, name: "verde", color: "bg-green-500" },
        { id: 4, name: "naranja", color: "bg-orange-500" },
        { id: 5, name: "rojo", color: "bg-red-500" },
    ];

    const onDeleteGroup = () => {
        if (!window.confirm("¿Seguro que deseas eliminar este grupo?")) return;
        axios
            .delete(route("group.destroy", localConversations.id))
            .then((res) => emit("toast.show", res.data.message))
            .catch((err) => console.error(err));
    };

    const asignAsesor = (asesorId) => {
        axios
            .post(
                route("group.asignAsesor", [localConversations.id, asesorId]),
                { old_asesor: localConversations.asesor }
            )
            .then((res) => emit("toast.show", res.data.message))
            .catch((err) => console.error(err));
    };

    const changeStatus = (newStatus) => {
        axios
            .post(
                route("group.changeStatus", [localConversations.id, newStatus])
            )
            .then((res) => {
                emit("toast.show", res.data.message);
                setLocalConversations((prev) => ({
                    ...prev,
                    code_status: newStatus,
                }));
            })
            .catch((err) => {
                console.error(err);
                emit("toast.show", "Error al actualizar el estado");
            });
    };

    useEffect(() => {
        setLocalConversations(selectedConversation);
    }, [selectedConversation]);

    useEffect(() => {
        const offChangeAsesor = on("group.asesorChanged", (group) => {
            if (group.id === localConversations.id) {
                setLocalConversations((prev) => ({
                    ...prev,
                    users: group.users,
                    asesor: group.asesor,
                }));
            }
        });

        const offChangeStatus = on("group.statusChanged", (group) => {
            if (group.id === localConversations.id) {
                setLocalConversations((prev) => ({
                    ...prev,
                    code_status: group.code_status,
                }));
            }
        });

        return () => {
            offChangeStatus();
            offChangeAsesor();
        };
    }, [on, localConversations.id]);

    useEffect(() => {
        if (asesores && asesores.length > 0) {
            const sorted = [...asesores].sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            setSortedAsesors(sorted);
        }
    }, [asesores]);

    const statusColor =
        status.find((s) => s.id === localConversations.code_status)?.color ??
        "border-gray-500";

    return (
        <>
            {selectedConversation && (
                <div className="p-3 flex justify-between items-center border-b border-slate-700">
                    {/* Información del grupo o usuario */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("dashboard")}
                            className="inline-block sm:hidden"
                        >
                            <ArrowLeftIcon className="w-6" />
                        </Link>
                        {selectedConversation.is_user && (
                            <UserAvatar user={selectedConversation} />
                        )}
                        {selectedConversation.is_group && <GroupAvatar />}
                        <div>
                            <h3>{selectedConversation.name}</h3>
                            {selectedConversation.is_group && (
                                <p className="text-xs text-gray-500">
                                    {selectedConversation.users.length} miembros
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Acciones del grupo */}
                    {onGroup && selectedConversation.is_group ? (
                        <div className="flex gap-2 items-center">
                            {/* Asignar asesor (icono) */}
                            {localConversations.is_group &&
                                !localConversations.is_admin &&
                                !localConversations.is_asesor &&
                                currentUser.is_asesor && (
                                    <Menu
                                        as="div"
                                        className="relative inline-block text-left"
                                    >
                                        <Menu.Button
                                            className="flex items-center rounded-full p-2 text-gray-100 hover:bg-black/30 bg-gray-700"
                                            title="Asignar asesor"
                                        >
                                            <UserIcon className="w-5 h-5" />
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
                                            <Menu.Items className="absolute top-10 right-0 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                                                <div className="px-1 py-1">
                                                    {sortedAsesors &&
                                                        sortedAsesors.map(
                                                            (asesor) => (
                                                                <Menu.Item
                                                                    key={
                                                                        asesor.id
                                                                    }
                                                                >
                                                                    {({
                                                                        active,
                                                                    }) => (
                                                                        <button
                                                                            onClick={() =>
                                                                                asignAsesor(
                                                                                    asesor.id
                                                                                )
                                                                            }
                                                                            className={`${
                                                                                active
                                                                                    ? "bg-black/30 text-white"
                                                                                    : "text-gray-100"
                                                                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <span className="truncate">
                                                                                {
                                                                                    asesor.name
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )
                                                        )}
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                )}

                            {/* Cambiar estado (icono) */}
                            {localConversations.is_group &&
                                !localConversations.is_admin &&
                                !localConversations.is_asesor &&
                                currentUser.is_asesor && (
                                    <Menu
                                        as="div"
                                        className="relative inline-block text-left"
                                    >
                                        <Menu.Button
                                            className={`flex items-center rounded-full p-2 text-gray-100 hover:bg-black/30 ${statusColor} `}
                                            title="Cambiar estado"
                                        >
                                            {/* Círculo de estado */}
                                            <span className="w-5 h-5 flex items-center justify-center">
                                                <span className="w-3 h-3 bg-white rounded-full border border-gray-400"></span>
                                            </span>
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
                                            <Menu.Items className="absolute top-10 right-0 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                                                <div className="px-1 py-1">
                                                    {status &&
                                                        status.map((status) => (
                                                            <Menu.Item
                                                                key={status.id}
                                                            >
                                                                {({
                                                                    active,
                                                                }) => (
                                                                    <button
                                                                        onClick={() =>
                                                                            changeStatus(
                                                                                status.id
                                                                            )
                                                                        }
                                                                        className={`${
                                                                            active
                                                                                ? "bg-black/30 text-white"
                                                                                : "text-gray-100"
                                                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                    >
                                                                        <div className="flex justify-between items-center w-full">
                                                                            <span className="truncate">
                                                                                {
                                                                                    status.name
                                                                                }
                                                                            </span>
                                                                            <span
                                                                                className={`w-3 h-3 ${status.color} rounded-full ml-2`}
                                                                            ></span>
                                                                        </div>
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        ))}
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                )}

                            {/* Menú de tres puntos para acciones principales */}
                            <Menu
                                as="div"
                                className="relative inline-block text-left"
                            >
                                <Menu.Button
                                    className="flex items-center rounded-full p-2 text-gray-100 hover:bg-black/30 bg-gray-700"
                                    title="Más opciones"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
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
                                    <Menu.Items className="absolute top-10 right-0 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                                        <div className="px-1 py-1">
                                            {/* Acciones solo para admin */}
                                            {currentUser.is_admin && (
                                                <>
                                                    <Menu.Item>
                                                        <GroupUsersPopover
                                                            users={
                                                                selectedConversation.users
                                                            }
                                                        />
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        <GroupDescriptionPopover
                                                            description={
                                                                selectedConversation.description
                                                            }
                                                        />
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={() =>
                                                                    emit(
                                                                        "GroupModal.show",
                                                                        localConversations
                                                                    )
                                                                }
                                                                className={`${
                                                                    active
                                                                        ? "bg-black/30 text-white"
                                                                        : "text-gray-100"
                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                            >
                                                                <PencilSquareIcon className="w-4 h-4 mr-2" />
                                                                Editar grupo
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={
                                                                    onDeleteGroup
                                                                }
                                                                className={`${
                                                                    active
                                                                        ? "bg-black/30 text-white"
                                                                        : "text-gray-100"
                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                            >
                                                                <TrashIcon className="w-4 h-4 mr-2" />
                                                                Borrar grupo
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </>
                                            )}
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    ) : (
                        <div></div>
                    )}
                </div>
            )}
        </>
    );
};

export default ConversationHeader;
