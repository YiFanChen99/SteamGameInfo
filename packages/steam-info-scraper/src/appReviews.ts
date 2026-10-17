/** The subset of the `/appreviews/<appid>?json=1` response that is read. */
export interface AppReviewsResponse {
    success: number;
    query_summary: {
        total_positive: number;
        total_reviews: number;
    };
    reviews: {
        author: {
            /** Total playtime, in minutes. */
            playtime_forever: number;
        };
    }[];
}

export interface AppReviewsInfo {
    /** Positive reviews, all languages. */
    totalPositive: number;
    /** All reviews, all languages. */
    totalReviews: number;
    /** Each fetched reviewer's total playtime, in minutes. */
    playtimeMinutes: number[];
}

/**
 * @param json Body of `appReviewsUrl(appId)`.
 */
export function parseAppReviews(json: string): AppReviewsInfo {
    const data = JSON.parse(json) as AppReviewsResponse;
    if (data.success !== 1) {
        throw new Error(`appreviews failed: success=${data.success}`);
    }

    return {
        totalPositive: data.query_summary.total_positive,
        totalReviews: data.query_summary.total_reviews,
        playtimeMinutes: data.reviews.map(review => review.author.playtime_forever),
    };
}
