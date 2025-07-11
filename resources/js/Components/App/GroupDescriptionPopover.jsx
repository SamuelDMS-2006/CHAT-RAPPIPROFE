import { Popover, Transition } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";

export default function GroupDescriptionPopover({ description }) {
    return (
        <Popover className="relative ">
            {({ open }) => (
                <>
                    <Popover.Button
                        className={`${
                            open ? "bg-black/30 text-white" : "text-gray-100"
                        } hover:text-gray-200 group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-black/30`}
                    >
                        <ExclamationCircleIcon className="w-4" />
                        <span className="px-2">Descripción</span>
                    </Popover.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-10 mt-3 w-[300px] px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
                                <div className="bg-gray-800 p-4">
                                    <h2 className="text-lg mb-3">
                                        Descripción
                                    </h2>
                                    {description && (
                                        <div className="text-xs">
                                            {description}
                                        </div>
                                    )}
                                    {!description && (
                                        <div className="text-xs text-gray-500 text-center py-4">
                                            El grupo no tiene una
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
