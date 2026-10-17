import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Store page parsing takes a DOM Document, as userscripts get from DOMParser.
        environment: 'happy-dom',
        environmentOptions: {
            happyDOM: {
                // Fixtures are inert HTML: never fetch or run what they reference.
                settings: {
                    disableJavaScriptEvaluation: true,
                    disableJavaScriptFileLoading: true,
                    disableCSSFileLoading: true,
                    disableIframePageLoading: true,
                    handleDisabledFileLoadingAsSuccess: true,
                },
            },
        },
    },
});
