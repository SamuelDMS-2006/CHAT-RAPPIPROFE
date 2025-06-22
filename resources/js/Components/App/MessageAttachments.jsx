import {
    PaperClipIcon,
    ArrowDownTrayIcon,
    PlayCircleIcon,
} from "@heroicons/react/24/solid";
import { isAudio, isImage, isPDF, isPreviewable, isVideo } from "../../helpers";

const MessageAttachments = ({ attachments, attachmentClick }) => {
    return (
        <>
            {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 justify-end sm:justify-start max-w-full overflow-x-auto">
                    {attachments.map((attachment, ind) => (
                        <div
                            onClick={(ev) => attachmentClick(attachments, ind)}
                            key={attachment.id}
                            className={
                                `group flex flex-col justify-center text-gray-500 relative cursor-pointer rounded-lg shadow-sm overflow-hidden w-full ` +
                                (
                                    isPDF(attachment) || isAudio(attachment)
                                        ? "w-[30vh] sm:max-w-[30vw] sm:w-[30vw] min-w-[30vh]"
                                        : ""
                                )
                            }
                            style={{ minWidth: isAudio(attachment) ? "150px" : "auto" }}
                        >
                            {isImage(attachment) && (
                                <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-xl overflow-hidden bg-black group">
                                    <img
                                        src={attachment.url}
                                        className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                                        alt={attachment.name}
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end">
                                        <span className="text-xs text-white truncate">{attachment.name}</span>
                                    </div>
                                </div>
                            )}
                            {isVideo(attachment) && (
                                <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-xl overflow-hidden bg-black group flex items-center justify-center">
                                    <video
                                        src={attachment.url}
                                        className="object-cover w-full h-full"
                                        controls={false}
                                        preload="metadata"
                                        tabIndex={-1}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <PlayCircleIcon className="w-16 h-16 text-white opacity-80 drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end">
                                        <span className="text-xs text-white truncate">{attachment.name}</span>
                                    </div>
                                </div>
                            )}
                            {isAudio(attachment) && (
                                <div className="relative flex justify-center items-center w-full">
                                    <audio
                                        src={attachment.url}
                                        controls
                                        className="w-full bg-transparent"
                                    ></audio>
                                </div>
                            )}
                            {isPDF(attachment) && (
                                <div className="relative flex flex-col justify-center w-full h-32 sm:h-40 md:h-48 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded shadow border border-blue-900 overflow-hidden">
                                    <div className="flex flex-col justify-center w-full h-full">
                                        <div className="flex items-center justify-center bg-blue-800 rounded-full w-14 h-14 mb-2 shadow-lg mx-auto">
                                            <span className="text-white text-2xl font-bold">PDF</span>
                                        </div>
                                        <span className="text-white text-xs font-semibold px-2 text-center truncate w-full">{attachment.name}</span>
                                    </div>
                                    <a
                                        onClick={ev => ev.stopPropagation()}
                                        download
                                        href={attachment.url}
                                        className="absolute bottom-2 right-2 z-20 opacity-90 hover:opacity-100 transition-all w-8 h-8 flex items-center justify-center text-blue-100 bg-blue-900 rounded-full cursor-pointer shadow-lg hover:bg-blue-800"
                                        title="Descargar PDF"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                            {!isPreviewable(attachment) && (
                                <a
                                    onClick={(ev) => ev.stopPropagation()}
                                    download
                                    href={attachment.url}
                                    className="flex flex-col justify-center items-center w-full"
                                >
                                    <PaperClipIcon className="w-10 h-10 mb-3" />
                                    <small className="text-center break-all">
                                        {attachment.name}
                                    </small>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default MessageAttachments;
