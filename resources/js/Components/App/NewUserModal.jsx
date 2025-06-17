import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import { useForm } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import Checkbox from "../Checkbox";
import { useEffect } from "react";

export default function NewUserModal({ show = false, onClose = () => {} }) {
    const { emit } = useEventBus();

    const { data, setData, processing, reset, post, errors } = useForm({
        name: "",
        email: "",
        password: "",
        is_admin: false,
        is_asesor: false,
        countryCode: "+57",
        phoneNumber: "",
        telefono: "",
    });

    useEffect(() => {
        setData("telefono", `${data.countryCode}${data.phoneNumber}`);
    }, [data.countryCode, data.phoneNumber]);

    const submit = (e) => {
        e.preventDefault();
        post(route("user.store"), {
            onSuccess: () => {
                emit("toast.show", `User "${data.name}" was created`);
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={closeModal}>
            <form onSubmit={submit} className="p-6 overflow-y-auto">
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    Create New User
                </h2>

                <div className="mt-8">
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="tel" value="Tu número de telefono" />
                    <div className="flex items-start">
                        <select
                            name="countryCode"
                            value={data.countryCode}
                            onChange={(e) =>
                                setData("countryCode", e.target.value)
                            }
                            className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm rounded-r-none"
                        >
                            <option value="+57">CO 🇨🇴</option>
                            <option value="+52">MX 🇲🇽</option>
                            <option value="+54">AR 🇦🇷</option>
                            <option value="+1">US 🇺🇸</option>
                            <option value="+34">ES 🇪🇸</option>
                        </select>
                        <TextInput
                            id="tel"
                            type="tel"
                            name="phoneNumber"
                            value={data.phoneNumber}
                            onChange={(e) =>
                                setData("phoneNumber", e.target.value)
                            }
                            placeholder="300 123 4567"
                            className="mt-0 block w-full rounded-l-none"
                            required
                        />
                    </div>
                    <InputError className="mt-2" message={errors.telefono} />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        required
                    />
                    <InputError className="mt-2" message={errors.password} />
                </div>

                <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                        <Checkbox
                            name="is_admin"
                            checked={data.is_admin}
                            onChange={(e) =>
                                setData("is_admin", e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Admin User
                        </span>
                    </label>
                    <label className="flex items-center">
                        <Checkbox
                            name="is_asesor"
                            checked={data.is_asesor}
                            onChange={(e) =>
                                setData("is_asesor", e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Asesor
                        </span>
                    </label>
                    <InputError className="mt-2" message={errors.is_admin} />
                    <InputError className="mt-2" message={errors.is_asesor} />
                </div>

                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={closeModal}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton className="ms-3" disabled={processing}>
                        Create
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
