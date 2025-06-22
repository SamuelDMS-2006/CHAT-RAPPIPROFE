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
                                `group flex flex-col items-center justify-center text-gray-500 relative cursor-pointerrounded-lg shadow-sm overflow-hidden ` +
                                (isAudio(attachment)
                                    ? "w-full bg-transparent"
                                    : "w-full sm:w-40 md:w-48 aspect-square p-2")
                            }
                            style={{ minWidth: isAudio(attachment) ? "200px" : "auto" }}
                        >
                            {!isAudio(attachment) && (
                                <a
                                    onClick={(ev) => ev.stopPropagation()}
                                    download
                                    href={attachment.url}
                                    className="z-20 opacity-100 group-hover:opacity-100 transition-all w-8 h-8 flex items-center justify-center text-gray-100 bg-gray-700 rounded absolute right-2 top-2 cursor-pointer hover:bg-gray-800"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                </a>
                            )}

                            {isImage(attachment) && (
                                <img
                                    src={attachment.url}
                                    className="object-contain w-full h-32 sm:h-40 md:h-48 rounded"
                                    alt={attachment.name}
                                />
                            )}
                            {isVideo(attachment) && (
                                <div className="relative flex justify-center items-center w-full h-32 sm:h-40 md:h-48">
                                    <PlayCircleIcon className="z-20 absolute w-16 h-16 text-white opacity-70" />
                                    <div className="absolute left-0 top-0 w-full h-full bg-black/50 z-10 rounded"></div>
                                    <video src={attachment.url} className="w-full h-full object-cover rounded"></video>
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
                                <div className="relative flex justify-center items-center w-full h-32 sm:h-40 md:h-48">
                                    <iframe
                                        src={attachment.url}
                                        className="w-full h-full rounded"
                                    ></iframe>
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
