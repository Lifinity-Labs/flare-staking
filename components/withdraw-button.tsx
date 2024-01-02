import { mdiStarThreePoints } from "@mdi/js";

export default function WithdrawButton({
  selecting,
  onWithdraw,
  onConfirm,
  onCancel,
  confirmable,
}: any) {
  if (selecting) {
    return (
      <div>
        <button
          className="mr-2 lg:mr-3 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-2 lg:px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          disabled={!confirmable}
          className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-2 lg:px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    );
  } else {
    return (
      <button
        className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
        onClick={onWithdraw}
      >
        Withdraw
      </button>
    );
  }
}
