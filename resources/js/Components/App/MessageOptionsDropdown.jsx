import { Menu, Transition } from "@headlessui/react";
import { Fragment, useRef, useState, useEffect } from "react";
import { EllipsisVerticalIcon, TrashIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import { useEventBus } from "@/EventBus";
import { usePage } from "@inertiajs/react";

const EMOJIS = ["😀", "😂", "😍", "😮", "😢", "👍", "❤️"];

export default function MessageOptionsDropdown({
    message,
    onReact,
    position = "left",
    currentUser,
}) {
    const { emit } = useEventBus();
    currentUser = currentUser || usePage().props.auth.user;
    const emojiBtnRef = useRef();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [openDirection, setOpenDirection] = useState("up");

    // Encuentra la reacción del usuario actual (si existe)
    const userReaction = message.reactions?.find(r => r.user_id === currentUser.id);
    const userEmoji = userReaction?.reaction || null;

    // Maneja la eliminación del mensaje
    const onMessageDelete = () => {
        axios
            .delete(route("message.destroy", message.id))
            .then((res) => {
                emit("message.deleted", {
                    message,
                    prevMessage: res.data.message,
                });
            })
            .catch((err) => {
                console.error(err);
            });
    };

    // Maneja la acción de responder
    const onReply = () => {
        emit("message.reply", { message });
    };

    // Determina la clase de posición del menú principal
    const positionClass =
        position === "left"
            ? "right-full"
            : "left-full flex-row-reverse";

    // Detecta si el botón está cerca del borde superior y ajusta la dirección del menú
    useEffect(() => {
        if (showEmojiPicker && emojiBtnRef.current) {
            const rect = emojiBtnRef.current.getBoundingClientRect();
            if (rect.top < 120) { // 120px de margen superior
                setOpenDirection("down");
            } else {
                setOpenDirection("up");
            }
        }
    }, [showEmojiPicker]);

    return (
        <div className={`absolute ${positionClass} text-gray-100 top-1/2 -translate-y-1/2 z-50`}>
            <div className={`flex items-center gap-1 ${position === "right" ? "flex-row-reverse" : ""}`}>
                {/* Botón de emoji para reaccionar */}
                <div className="relative" ref={emojiBtnRef}>
                    <button
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className={`text-gray-400 hover:text-yellow-400 text-xl p-1 rounded-full border border-transparent hover:border-yellow-400 transition ${
                            userEmoji ? "bg-yellow-100" : ""
                        }`}
                        title="Reaccionar"
                    >
                        {userEmoji ? userEmoji : "🙂"}
                    </button>
                    {/* Selector de emojis */}
                    {showEmojiPicker && (
                        <div className={
                            `absolute left-1/2 -translate-x-1/2 
                            ${openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"}
                            bg-gray-800 p-2 rounded shadow-lg flex gap-2 z-50`
                        }>
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    className={`text-2xl hover:scale-125 transition ${
                                        userEmoji === emoji
                                            ? "ring-2 ring-yellow-400"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setShowEmojiPicker(false);
                                        if (userEmoji === emoji) {
                                            onReact(message.id, null);
                                        } else {
                                            onReact(message.id, emoji);
                                        }
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Botón de opciones (tres puntos) */}
                <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="flex justify-center items-center w-8 h-8 rounded-full hover:bg-black/40">
                        <EllipsisVerticalIcon className="h-5 w-5" />
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
                        <Menu.Items className="absolute right-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                            <div className="px-1 py-1 ">
                                {/* Opción: Responder */}
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={onReply}
                                            className={`${
                                                active
                                                    ? "bg-black/30 text-white"
                                                    : "text-gray-100"
                                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                        >
                                            <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                                            Responder
                                        </button>
                                    )}
                                </Menu.Item>
                                {/* Opción: Eliminar (solo para admin) */}
                                {currentUser.is_admin && (
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={onMessageDelete}
                                                className={`${
                                                    active
                                                        ? "bg-black/30 text-white"
                                                        : "text-gray-100"
                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                            >
                                                <TrashIcon className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </button>
                                        )}
                                    </Menu.Item>
                                )}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </div>
    );
}
