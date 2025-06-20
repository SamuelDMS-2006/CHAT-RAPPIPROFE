import { useState } from "react";
import {
    PaperClipIcon,
    PhotoIcon,
    FaceSmileIcon,
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
 * Mejorado para parecerse a WhatsApp, ser responsivo y tener todos los controles alineados verticalmente.
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
                "Por favor escribe un mensaje o adjunta archivos."
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
                    message || "Ocurrió un error al enviar el mensaje"
                );
            });
    };

    // Callback para cuando se graba un audio
    const recordedAudioReady = (file, url) => {
        setChosenFiles((prevFiles) => [...prevFiles, { file, url }]);
    };

    return (
        <div className="w-full max-w-full px-1 sm:px-2 py-2 bg-slate-800 border-t border-slate-700">
            {/* Barra de reply */}
            {replyTo && (
                <div className="w-full bg-gray-700 text-gray-200 p-2 rounded mb-2 flex justify-between items-center">
                    <div className="truncate">
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

            {/* Previsualización de archivos adjuntos */}
            {chosenFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 w-full">
                    {chosenFiles.map((file) => (
                        <div
                            key={file.file.name}
                            className="relative w-full flex flex-col items-center bg-slate-800 rounded-md p-4"
                        >
                            <div className="w-full flex items-center gap-3">
                                {isAudio(file.file) && (
                                    // El audio player ocupa el 100% del ancho disponible de su contenedor
                                    <div className="w-full max-w-full">
                                        <CustomAudioPlayer file={file} showVolume={false} />
                                    </div>
                                )}
                                <button
                                    onClick={() =>
                                        setChosenFiles(
                                            chosenFiles.filter(
                                                (f) => f.file.name !== file.file.name
                                            )
                                        )
                                    }
                                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:text-gray-100 hover:bg-gray-700 transition"
                                    title="Eliminar audio"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                            {/* Si tienes otros tipos de adjunto, colócalos aquí */}
                            {isImage(file.file) && (
                                <img
                                    src={file.url}
                                    alt=""
                                    className="w-16 h-16 object-cover rounded mt-2"
                                />
                            )}
                            {!isAudio(file.file) && !isImage(file.file) && (
                                <AttachmentPreview file={file} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Barra de input principal */}
            <div className="flex items-center gap-1 bg-slate-700 rounded-full px-2 py-1 w-full max-w-full relative flex-wrap">
                {/* Botón de emojis */}
                <Popover className="relative flex items-center">
                    <Popover.Button className="p-2 rounded-full text-gray-400 hover:text-gray-300 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        style={{ minWidth: 40, minHeight: 40, justifyContent: "center", alignItems: "center", display: "flex" }}>
                        <FaceSmileIcon className="w-6 h-6" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-10 left-0 bottom-full">
                        <EmojiPicker
                            theme="dark"
                            onEmojiClick={(ev) =>
                                setNewMessage(newMessage + ev.emoji)
                            }
                        />
                    </Popover.Panel>
                </Popover>
                {/* Input de mensaje */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <NewMessageInput
                        value={newMessage}
                        onSend={onSendClick}
                        onChange={(ev) => setNewMessage(ev.target.value)}
                        className="w-full"
                        placeholder="Escribe un mensaje"
                    />
                    {!!uploadProgress && (
                        <progress
                            className="w-full h-1 rounded overflow-hidden bg-slate-600"
                            value={uploadProgress}
                            max="100"
                            style={{ minWidth: 0 }}
                        ></progress>
                    )}
                    {inputErrorMessage && (
                        <span className="block w-full text-xs text-red-400 truncate">
                            {inputErrorMessage}
                        </span>
                    )}
                </div>
                {/* Botón de adjuntar archivos */}
                <Popover className="relative flex items-center">
                    <Popover.Button className="p-1 text-gray-400 hover:text-gray-300 flex items-center">
                        <PaperClipIcon className="w-6 h-6" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-20 right-0 bottom-full mb-2 bg-slate-700 rounded shadow-lg flex flex-col">
                        <label className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 cursor-pointer">
                            <PaperClipIcon className="w-5 h-5" />
                            <span>Archivo</span>
                            <input
                                type="file"
                                multiple
                                onChange={onFileChange}
                                className="hidden"
                            />
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 cursor-pointer">
                            <PhotoIcon className="w-5 h-5" />
                            <span>Imagen</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={onFileChange}
                                className="hidden"
                            />
                        </label>
                    </Popover.Panel>
                </Popover>
                {/* Botón dinámico: enviar o grabar audio */}
                {newMessage.trim().length === 0 && chosenFiles.length === 0 ? (
                    <AudioRecorder fileReady={recordedAudioReady} />
                ) : (
                    <button
                        onClick={onSendClick}
                        disabled={messageSending}
                        className="p-1 text-gray-400 hover:text-blue-400 flex items-center"
                        aria-label="Enviar mensaje"
                        type="button"
                    >
                        <PaperAirplaneIcon className="w-6 h-6 rotate-90" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MessageInput;
