import { useState } from "react";
import { router } from "@inertiajs/react";

export default function LandingPage() {
    const [form, setForm] = useState({
        telefono: "",
        nombre: "",
        email: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(route("groups.createForClient"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                credentials: "same-origin",
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                throw new Error("Error al crear el grupo");
            }

            const data = await response.json();

            // Redirige al chat del grupo recién creado
            router.visit(route("chat.group", data.group_id));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <h1 className="text-2xl font-bold mb-6">
                Bienvenido a nuestra plataforma
            </h1>
            <form
                className="bg-white p-8 rounded shadow-md w-full max-w-md"
                onSubmit={handleSubmit}
            >
                <div className="mb-4">
                    <label className="block mb-1 font-semibold">
                        Teléfono
                    </label>
                    <input
                        type="text"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-semibold">
                        Nombre
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-semibold">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                {error && (
                    <div className="mb-4 text-red-500">{error}</div>
                )}
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={loading}
                >
                    {loading ? "Creando grupo..." : "Iniciar Chat"}
                </button>
            </form>
        </div>
    );
}
