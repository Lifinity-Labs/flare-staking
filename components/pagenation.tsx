import { useMemo } from "react";

const boundaryCount = 1;
const siblingCount = 1;
// https://dev.to/namirsab/comment/2050
const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

export default function PageNation({
  count,
  page,
  onChange,
}: {
  count: number;
  page: number;
  onChange: (value: number) => void;
}) {
  const itemList = useMemo(() => {
    const startPages = range(1, Math.min(boundaryCount, count));
    const endPages = range(
      Math.max(count - boundaryCount + 1, boundaryCount + 1),
      count
    );

    const siblingsStart = Math.max(
      Math.min(
        // Natural start
        page - siblingCount,
        // Lower boundary when page is high
        count - boundaryCount - siblingCount * 2 - 1
      ),
      // Greater than startPages
      boundaryCount + 2
    );

    const siblingsEnd = Math.min(
      Math.max(
        // Natural end
        page + siblingCount,
        // Upper boundary when page is low
        boundaryCount + siblingCount * 2 + 2
      ),
      // Less than endPages
      endPages.length > 0 ? endPages[0] - 2 : count - 1
    );

    // Basic list of items to render
    // e.g. itemList = ['first', 'previous', 1, 'ellipsis', 4, 5, 6, 'ellipsis', 10, 'next', 'last']
    const itemList = [
      ...startPages,

      // Start ellipsis
      // eslint-disable-next-line no-nested-ternary
      ...(siblingsStart > boundaryCount + 2
        ? ["start-ellipsis"]
        : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),

      // Sibling pages
      ...range(siblingsStart, siblingsEnd),

      // End ellipsis
      // eslint-disable-next-line no-nested-ternary
      ...(siblingsEnd < count - boundaryCount - 1
        ? ["end-ellipsis"]
        : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),

      ...endPages,
    ];
    return itemList;
  }, [count, page]);

  return (
    <nav className="px-4 flex items-center justify-between sm:px-0">
      <div className="-mt-px w-0 flex-1 flex">
        {page !== 1 && (
          <button
            className="pr-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            onClick={() => {
              onChange(page - 1);
            }}
          >
            &lt; Previous
          </button>
        )}
      </div>
      <div className="hidden md:-mt-px md:flex">
        {itemList.map((i) => {
          if (typeof i === "number") {
            return (
              <button
                key={i}
                className={
                  page !== i
                    ? "text-gray-500 hover:text-gray-700 px-4 inline-flex items-center text-sm font-medium"
                    : "text-indigo-600 px-4 inline-flex items-center text-sm font-medium"
                }
                onClick={() => {
                  onChange(i);
                }}
              >
                {i}
              </button>
            );
          } else {
            return (
              <span
                key={i}
                className="text-gray-500 px-4 inline-flex items-center text-sm font-medium"
              >
                ...
              </span>
            );
          }
        })}
      </div>
      <div className="-mt-px w-0 flex-1 flex justify-end">
        {page !== count && (
          <button
            className="pl-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            onClick={() => {
              onChange(page + 1);
            }}
          >
            Next &gt;
          </button>
        )}
      </div>
    </nav>
  );
}
