import { useState } from "react";
import { router } from "@inertiajs/react";

export default function LandingPage() {
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        countryCode: "+57",
        phoneNumber: "",
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

    const getFullPhoneNumber = () => `${form.countryCode}${form.phoneNumber}`;

    const handlePhoneCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const fullPhoneNumber = getFullPhoneNumber();

        try {
            const response = await fetch(route("user.checkPhone"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: JSON.stringify({ telefono: fullPhoneNumber }),
            });

            if (!response.ok)
                throw new Error("Error de conexión con el servidor.");

            const data = await response.json();

            if (data.exists) {
                await loginAndCreateGroup(fullPhoneNumber);
            } else {
                setStep(2);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loginAndCreateGroup = async (fullPhoneNumber) => {
        setLoading(true);
        try {
            const response = await fetch(route("groups.createForClient"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: JSON.stringify({
                    telefono: fullPhoneNumber,
                    password: "password",
                }),
            });

            if (!response.ok)
                throw new Error(
                    "No se pudo iniciar sesión. Verifica el teléfono."
                );

            const data = await response.json();
            router.visit(route("chat.group", data.group_id));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterAndCreateGroup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const fullPhoneNumber = getFullPhoneNumber();

        try {
            const response = await fetch(route("groups.createForClient"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    telefono: fullPhoneNumber,
                    password: "password",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData.errors).join(" ");
                throw new Error(
                    errorMessages || "Error al registrar el usuario."
                );
            }

            const data = await response.json();
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

            {step === 1 ? (
                <form
                    className="bg-white p-8 rounded shadow-md w-full max-w-md"
                    onSubmit={handlePhoneCheck}
                >
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold">
                            Tu número de telefono
                        </label>
                        <div className="flex">
                            <select
                                name="countryCode"
                                value={form.countryCode}
                                onChange={handleChange}
                                className="border rounded-l px-3 py-2 bg-gray-50 focus:outline-none"
                            >
                                <option value="+57">CO 🇨🇴</option>
                                <option value="+52">MX 🇲🇽</option>
                                <option value="+54">AR 🇦🇷</option>
                                <option value="+1">US 🇺🇸</option>
                                <option value="+34">ES 🇪🇸</option>
                            </select>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                placeholder="300 123 4567"
                                className="w-full border-t border-b border-r rounded-r px-3 py-2"
                                required
                            />
                        </div>
                    </div>
                    {error && <div className="mb-4 text-red-500">{error}</div>}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? "Verificando..." : "Continuar"}
                    </button>
                </form>
            ) : (
                <form
                    className="bg-white p-8 rounded shadow-md w-full max-w-md"
                    onSubmit={handleRegisterAndCreateGroup}
                >
                    <p className="mb-4">
                        Parece que eres nuevo. ¡Completa tu registro!
                    </p>
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
                    {error && <div className="mb-4 text-red-500">{error}</div>}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? "Creando cuenta..." : "Iniciar Chat"}
                    </button>
                </form>
            )}
        </div>
    );
}
