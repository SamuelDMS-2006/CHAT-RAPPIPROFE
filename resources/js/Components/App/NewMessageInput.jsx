import React, { useEffect, useRef, useState } from "react";

/**
 * Componente de entrada de mensajes con sugerencias de quick replies.
 * Mejorado para parecerse al input de WhatsApp.
 */
const NewMessageInput = ({
    value,
    onChange,
    onSend,
    userRole = "asesor",
    replyTo,
    onCancelReply,
    className = "",
    placeholder = "Escribe un mensaje",
    onKeyDown,
}) => {
    const input = useRef();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [quickReplies, setQuickReplies] = useState([]);

    // Cargar quick replies desde el backend al montar el componente o cambiar el rol
    useEffect(() => {
        axios
            .get("/quick-replies", { params: { role: userRole } })
            .then(res => setQuickReplies(res.data))
            .catch(() => setQuickReplies([]));
    }, [userRole]);

    // Manejar navegación y selección de sugerencias con el teclado
    const onInputKeyDown = (ev) => {
        if (showSuggestions) {
            if (ev.key === "ArrowDown") {
                ev.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            } else if (ev.key === "ArrowUp") {
                ev.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (ev.key === "Enter") {
                ev.preventDefault();
                if (suggestions[selectedIndex]) {
                    insertQuickReply(suggestions[selectedIndex].value);
                }
            } else if (ev.key === "Escape") {
                setShowSuggestions(false);
            }
        } else if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            onSend();
        }
        if (onKeyDown) onKeyDown(ev);
    };

    // Manejar cambios en el textarea y mostrar sugerencias si corresponde
    const onChangeEvent = (ev) => {
        const val = ev.target.value;
        onChange(ev);

        // Buscar si hay un "/" al final de una palabra
        const match = val.match(/(^|\s)\/(\w*)$/);
        if (match) {
            const query = match[2].toLowerCase();
            const filtered = quickReplies.filter(q =>
                q.label.toLowerCase().startsWith("/" + query)
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setSelectedIndex(0);
        } else {
            setShowSuggestions(false);
        }
        setTimeout(() => adjustHeight(), 10);
    };

    // Insertar el texto de la quick reply seleccionada
    const insertQuickReply = (text) => {
        const val = value.replace(/(^|\s)\/\w*$/, "$1" + text + " ");
        onChange({ target: { value: val } });
        setShowSuggestions(false);
        setTimeout(() => input.current && input.current.focus(), 0);
    };

    // Ajustar la altura del textarea automáticamente
    const adjustHeight = () => {
        setTimeout(() => {
            if (input.current) {
                input.current.style.height = "auto";
                input.current.style.height = input.current.scrollHeight + 1 + "px";
            }
        }, 100);
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <div className={`relative w-full ${className}`}>
            {showSuggestions && (
                <ul className="absolute left-0 bottom-full w-full mb-2 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto animate-fade-in"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                >
                    {suggestions.map((s, idx) => (
                        <li
                            key={s.label}
                            className={`px-3 py-2 cursor-pointer ${idx === selectedIndex ? "bg-blue-100" : ""}`}
                            onMouseDown={() => insertQuickReply(s.value)}
                        >
                            <span className="font-mono text-blue-700">{s.label}</span>
                            <span className="block text-xs text-gray-500 truncate">{s.value.slice(0, 80)}{s.value.length > 80 ? "..." : ""}</span>
                        </li>
                    ))}
                </ul>
            )}

            <textarea
                ref={input}
                value={value}
                rows="1"
                placeholder={placeholder}
                onKeyDown={onInputKeyDown}
                onChange={onChangeEvent}
                className="w-full resize-none overflow-y-auto max-h-32 bg-transparent text-gray-100 rounded-full px-0 py-2 focus:ring-0 focus:outline-none placeholder-gray-400 transition-all align-middle"
                style={{
                    minHeight: "40px",
                    boxShadow: "none",
                    border: "none",
                }}
            ></textarea>
        </div>
    );
};

export default NewMessageInput;
