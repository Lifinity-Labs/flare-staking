import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function ConfirmDialog({
  open,
  onClose,
  onLock,
  numberOfFlaresToLock,
  rewardRate,
  lockPeriodEndsOn,
}: {
  open: boolean;
  onClose: () => void;
  onLock: () => void;
  numberOfFlaresToLock: number;
  rewardRate: number;
  lockPeriodEndsOn: string;
}) {
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-stone-800 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 text-stone-100"
                >
                  Are you sure you want to lock?
                </Dialog.Title>
                <p className="text-stone-400 my-1">
                  Once you lock you will not be able to withdraw until{" "}
                  {lockPeriodEndsOn}
                </p>
                <div className="mt-4">
                  <div className="text-sm text-stone-400">
                    <div className="flex">
                      <span className="grow">Number of Flares to lock:</span>
                      <span>{numberOfFlaresToLock}</span>
                    </div>
                    <div className="flex">
                      <span className="grow">
                        Amount of veLFNTY you receive:
                      </span>
                      <span>
                        {(numberOfFlaresToLock * 100 * rewardRate).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="grow">Lock period ends on:</span>
                      <span>{lockPeriodEndsOn}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-stone-500 italic">
                  If your address holds veLFNTY with a lock period of less than
                  4 years, this will extend its lock period to 4 years. To avoid
                  this, please lock your Flares from a different address.
                </p>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={onLock}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={onClose}
                  >
                    Cancel
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
