import { MicrophoneIcon, StopCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const AudioRecorder = ({ fileReady }) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recording, setRecording] = useState(false);
    const [stream, setStream] = useState(null);

    const onMicrophoneClick = async () => {
        if (recording) {
            setRecording(false);
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
            return;
        }
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            setStream(userStream);
            const newMediaRecorder = new MediaRecorder(userStream);
            const chunks = [];

            newMediaRecorder.addEventListener("dataavailable", (event) => {
                chunks.push(event.data);
            });

            newMediaRecorder.addEventListener("stop", () => {
                let audioBlob = new Blob(chunks, {
                    type: "audio/ogg; codecs=opus",
                });
                let audioFile = new File([audioBlob], "recorded_audio.ogg", {
                    type: "audio/ogg; codecs=opus",
                });

                const url = URL.createObjectURL(audioFile);

                fileReady(audioFile, url);

                // Detener el stream de audio para liberar el micrófono
                if (userStream) {
                    userStream.getTracks().forEach((track) => track.stop());
                }
                setStream(null);
                setMediaRecorder(null);
            });

            newMediaRecorder.start();
            setMediaRecorder(newMediaRecorder);
            setRecording(true);
        } catch (error) {
            setRecording(false);
            console.error("Error accessing microphone:", error);
        }
    };

    return (
        <button
            onClick={onMicrophoneClick}
            className={`p-1 flex items-center ${
                recording
                    ? "text-red-500 animate-pulse"
                    : "text-gray-400 hover:text-gray-200"
            }`}
            aria-label={recording ? "Detener grabación" : "Grabar audio"}
            type="button"
        >
            {recording ? (
                <StopCircleIcon className="w-6" />
            ) : (
                <MicrophoneIcon className="w-6" />
            )}
        </button>
    );
};

export default AudioRecorder;
