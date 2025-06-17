import { useEventBus } from "@/EventBus";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import UserAvatar from "./UserAvatar";
import { Link } from "@inertiajs/react";

export default function NewUsersNotification({}) {
    const [toasts, setToasts] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        const offNewGroup = on("group.created", ({ message, group }) => {
            const uuid = uuidv4();
            setToasts((oldToasts) => [...oldToasts, { message, uuid, group }]);

            setTimeout(() => {
                setToasts((oldToasts) =>
                    oldToasts.filter((toast) => toast.uuid !== uuid)
                );
            }, 10000);
        });

        return () => {
            offNewGroup();
        };
    }, [on]);

    return (
        <div className="toast toast-top toast-center min-w-[300px]">
            {toasts.map((toast, index) => (
                <Link
                    key={toast.uuid}
                    href={route("chat.group", toast.group.id)}
                    className="alert alert-success py-3 px-4 text-gray-100 rounded-md w-full flex items-center gap-2"
                >
                    <span className="text-nowrap text-ellipsis overflow-hidden">
                        {toast.message}
                    </span>
                </Link>
            ))}
        </div>
    );
}
