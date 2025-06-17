import { useState } from "react";
import {
    PaperClipIcon,
    PhotoIcon,
    FaceSmileIcon,
    HandThumbUpIcon,
    PaperAirplaneIcon,
    XCircleIcon,
} from "@heroicons/react/24/solid";
import NewMessageInput from "./NewMessageInput";
import EmojiPicker from "emoji-picker-react";
import { Popover } from "@headlessui/react";
import { isAudio, isImage } from "@/helpers";
import AttachmentPreview from "./AttachmentPreview";
import CustomAudioPlayer from "./CustomAudioPlayer";
import AudioRecorder from "./AudioRecorder";
import { useEventBus } from "@/EventBus";

/**
 * Componente para la entrada y envío de mensajes, adjuntos y respuestas (reply).
 * Props:
 * - conversation: objeto de la conversación actual (usuario o grupo)
 * - replyTo: mensaje al que se está respondiendo (opcional)
 * - onCancelReply: función para cancelar el reply (opcional)
 */
const MessageInput = ({
    conversation = null,
    replyTo = null,
    onCancelReply,
}) => {
    const [newMessage, setNewMessage] = useState("");
    const [inputErrorMessage, setInputErrorMessage] = useState("");
    const [messageSending, setMessageSending] = useState(false);
    const [chosenFiles, setChosenFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { emit } = useEventBus();

    // Maneja la selección de archivos adjuntos
    const onFileChange = (ev) => {
        const files = ev.target.files;
        const updatedFiles = [...files].map((file) => ({
            file: file,
            url: URL.createObjectURL(file),
        }));
        ev.target.value = null;
        setChosenFiles((prevFiles) => [...prevFiles, ...updatedFiles]);
    };

    // Envía el mensaje (texto, adjuntos y reply)
    const onSendClick = () => {
        if (messageSending) return;
        if (newMessage.trim() === "" && chosenFiles.length === 0) {
            setInputErrorMessage(
                "Please provide a message or upload attachments."
            );
            setTimeout(() => setInputErrorMessage(""), 3000);
            return;
        }
        const formData = new FormData();
        chosenFiles.forEach((file) => {
            formData.append("attachments[]", file.file);
        });
        formData.append("message", newMessage);
        if (conversation.is_user) {
            formData.append("receiver_id", conversation.id);
        } else if (conversation.is_group) {
            formData.append("group_id", conversation.id);
        }
        // Incluye el reply_to_id si se está respondiendo a un mensaje
        if (replyTo) {
            formData.append("reply_to_id", replyTo.id);
        }

        setMessageSending(true);

        axios
            .post(route("message.store"), formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    if (chosenFiles.length > 0) setUploadProgress(progress);
                },
            })
            .then((response) => {
                emit("message.sent", [conversation.id, response.data]);
                setNewMessage("");
                setMessageSending(false);
                setUploadProgress(0);
                setChosenFiles([]);
                if (onCancelReply) onCancelReply();
            })
            .catch((error) => {
                setMessageSending(false);
                setChosenFiles([]);
                const message = error?.response?.data?.message;
                setInputErrorMessage(
                    message || "An error occurred while sending message"
                );
            });
    };

    // Envía un "like" rápido
    const onLikeClick = () => {
        if (messageSending) return;
        const data = { message: "👍" };
        if (conversation.is_user) {
            data["receiver_id"] = conversation.id;
        } else if (conversation.is_group) {
            data["group_id"] = conversation.id;
        }
        axios.post(route("message.store"), data);
    };

    // Callback para cuando se graba un audio
    const recordedAudioReady = (file, url) => {
        setChosenFiles((prevFiles) => [...prevFiles, { file, url }]);
    };

    return (
        <div className="flex flex-wrap items-start border-t border-slate-700 py-3">
            {replyTo && (
                <div className="w-full bg-gray-700 text-gray-200 p-2 rounded mb-2 flex justify-between items-center">
                    <div>
                        <span className="font-semibold">
                            {replyTo.sender?.name}:
                        </span>{" "}
                        <span className="italic">{replyTo.message}</span>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="ml-2 text-red-400"
                    >
                        Cancelar
                    </button>
                </div>
            )}
            {/* Botones para adjuntar archivos, imágenes y grabar audio */}
            <div className="order-2 flex-1 xs:flex-none xs:order-1 p-2">
                <button className="p-1 text-gray-400 hover:text-gray-300 relative overflow-hidden">
                    <PaperClipIcon className="w-6" />
                    <input
                        type="file"
                        multiple
                        onChange={onFileChange}
                        className="absolute left-0 top-0 right-0 bottom-0 z-20 opacity-0 cursor-pointer"
                    />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-300 relative overflow-hidden">
                    <PhotoIcon className="w-6" />
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onFileChange}
                        className="absolute left-0 top-0 right-0 bottom-0 z-20 opacity-0 cursor-pointer"
                    />
                </button>
                <AudioRecorder fileReady={recordedAudioReady} />
            </div>
            {/* Input de mensaje */}
            <div className="order-1 px-3 xs:p-0 min-w-[220px] basis-full xs:basis-0 xs:order-2 flex-1 relative">
                <div className="flex">
                    <NewMessageInput
                        id="chat-message"
                        name="chat-message"
                        value={newMessage}
                        onSend={onSendClick}
                        onChange={(ev) => setNewMessage(ev.target.value)}
                    />
                    <button
                        onClick={onSendClick}
                        disabled={messageSending}
                        className="btn btn-info rounded-l-none"
                    >
                        <PaperAirplaneIcon className="w-6" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
                {/* Barra de progreso de subida de archivos */}
                {!!uploadProgress && (
                    <progress
                        className="progress progress-info w-full"
                        value={uploadProgress}
                        max="100"
                    ></progress>
                )}
                {/* Mensaje de error */}
                {inputErrorMessage && (
                    <p className="text-xs text-red-400">{inputErrorMessage}</p>
                )}
                {/* Previsualización de archivos adjuntos */}
                <div className="flex flex-wrap gap-1 mt-2">
                    {chosenFiles.map((file) => (
                        <div
                            key={file.file.name}
                            className={
                                `relative flex justify-between cursor-pointer ` +
                                (!isImage(file.file) ? " w-[240px]" : "")
                            }
                        >
                            {isImage(file.file) && (
                                <img
                                    src={file.url}
                                    alt=""
                                    className="w-16 h-16 object-cover"
                                />
                            )}
                            {isAudio(file.file) && (
                                <CustomAudioPlayer
                                    file={file}
                                    showVolume={false}
                                />
                            )}
                            {!isAudio(file.file) && !isImage(file.file) && (
                                <AttachmentPreview file={file} />
                            )}
                            <button
                                onClick={() =>
                                    setChosenFiles(
                                        chosenFiles.filter(
                                            (f) =>
                                                f.file.name !== file.file.name
                                        )
                                    )
                                }
                                className="absolute w-6 h-6 rounded-full bg-gray-800 -right-2 -top-2 text-gray-300 hover:text-gray-100 z-10"
                            >
                                <XCircleIcon className="w-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Botones para emojis y like */}
            <div className="order-3 xs:order-3 p-2 flex">
                <Popover className="relative">
                    <Popover.Button className="p-1 text-gray-400 hover:text-gray-300">
                        <FaceSmileIcon className="w-6 h-6" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-10 right-0 bottom-full">
                        <EmojiPicker
                            theme="dark"
                            onEmojiClick={(ev) =>
                                setNewMessage(newMessage + ev.emoji)
                            }
                        />
                    </Popover.Panel>
                </Popover>
                <button
                    onClick={onLikeClick}
                    className="p-1 text-gray-400 hover:text-gray-300"
                >
                    <HandThumbUpIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
