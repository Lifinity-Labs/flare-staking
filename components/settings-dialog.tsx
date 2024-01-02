import { Dialog, Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { useSettingsStore } from "../store/settings";

const endpointList = [
  {
    id: 1,
    name: "Solana",
    endpoint: "https://api.devnet.solana.com/",
  },
];

export const findSelectedEndpoint = (id: number) => {
  return endpointList.find((endpoint) => id === endpoint.id) ?? endpointList[0];
};

export default function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    selectedEndpointId,
    customEndpoint,
    setSelectedEndpointId,
    setCustomEndpoint,
  } = useSettingsStore();

  const [selected, setSelected] = useState(
    findSelectedEndpoint(selectedEndpointId)
  );

  const [formValues, setFormValues] = useState({
    customEndpoint,
  });

  const updateCustomEndpoint = () => {
    setSelectedEndpointId(selected.id);
    setCustomEndpoint(formValues.customEndpoint);
    onClose();
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-700 bg-opacity-70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-stone-800 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 text-stone-100"
                >
                  Settings
                </Dialog.Title>
                <div className="mt-3 border-t border-zinc-700 pt-3">
                  <span className="text-sm text-neutral-400">RPC endpoint</span>
                  <Listbox value={selected} onChange={setSelected}>
                    <div className="relative mt-3">
                      <Listbox.Button className="relative w-full rounded-md bg-neutral-600 text-stone-300 py-3 pl-3 pr-10 text-left shadow-md sm:text-sm">
                        <span className="block truncate">{selected.name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-300"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-neutral-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {endpointList.map((endpoint, endpointIdx) => (
                            <Listbox.Option
                              key={endpointIdx}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                  active
                                    ? "bg-neutral-800/50 text-neutral-300"
                                    : "text-gray-300"
                                }`
                              }
                              value={endpoint}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    {endpoint.name}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                                      <CheckIcon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                  <input
                    type="text"
                    placeholder="Custom RPC URL"
                    className="mt-3 mb-5 w-full rounded border focus-visible:outline-0 focus-visible:border-indigo-500 border-zinc-500 bg-neutral-700 p-3 text-sm text-gray-300 placeholder:text-neutral-500"
                    value={formValues.customEndpoint}
                    onChange={(e) => {
                      setFormValues({
                        ...formValues,
                        customEndpoint: e.target.value,
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={updateCustomEndpoint}
                  >
                    Update RPC endpoint
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
