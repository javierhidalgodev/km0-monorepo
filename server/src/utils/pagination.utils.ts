export const parseRequestLimit = (requestedLimit: string | undefined): number => {
	const parsedLimit = Number(requestedLimit);
	const limit = Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 10, 50);

	return limit;
}

// TODO: Extract a generic cursor pagination helper:
// - input: items (limit + 1), limit, getCursor(item)
// - output: itemsToReturn, hasMore, nextCursor
export const getPagination = <T>(
    data: T[],
    limit: number,
    getCursor: (item: T) => string
) => {
    const hasMore = data.length > limit;
    
    const itemsToReturn = hasMore
        ? data.slice(0, limit)
        : data;

    const nextCursor = hasMore
        ? getCursor(itemsToReturn[itemsToReturn.length - 1])
        : undefined

    return { hasMore, itemsToReturn, nextCursor };
}