import * as Sentry from '@sentry/react';
import { mutate } from 'swr';

function safeMutate<T>(
    cacheKey: string,
    updater: (data: T | undefined) => T | undefined,
    revalidate = false
) {
    mutate(cacheKey, updater, revalidate).catch((err) => {
        if (import.meta.env.MODE === 'development') {
            console.error('safeMutate error:', err);
        } else {
            Sentry.captureException(err, {
                tags: { function: 'safeMutate' },
                extra: {
                    cacheKey,
                    errMessage: err?.message,
                },
            });
        }
    });
}

export default safeMutate;
