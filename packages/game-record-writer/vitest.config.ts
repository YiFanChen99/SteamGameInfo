import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // The default HTML parser is the browser's DOMParser.
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
