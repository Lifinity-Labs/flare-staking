import { Dialog, Transition } from "@headlessui/react";
import { Fragment, ReactNode, useRef } from "react";

export default function ProgressDialog({
  children,
  open,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  let refDiv = useRef(null);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        initialFocus={refDiv}
        as="div"
        className="relative z-30"
        onClose={onClose}
      >
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-stone-800 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-base text-center leading-6 text-stone-100"
                >
                  <div ref={refDiv}>{children}</div>
                </Dialog.Title>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
