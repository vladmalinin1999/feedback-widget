import * as react_jsx_runtime from 'react/jsx-runtime';

interface FeedbackWidgetProps {
    onSubmit: (data: {
        email?: string;
        description: string;
        screenshots: string[];
    }) => Promise<{
        success: boolean;
        error?: string;
    }>;
    labels?: {
        title?: string;
        description?: string;
        submit?: string;
        cancel?: string;
        takeScreenshot?: string;
        deleteScreenshot?: string;
        fullscreen?: string;
        close?: string;
        clear?: string;
        yourFeedbackHasBeenSent?: string;
        cannotSendFeedback?: string;
    };
    userEmail?: string;
    showUserEmail?: boolean;
    buttonPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    buttonStyle?: React.CSSProperties;
    className?: string;
}
declare const FeedbackWidget: ({ onSubmit, labels, userEmail, showUserEmail, buttonPosition, buttonStyle, className, }: FeedbackWidgetProps) => react_jsx_runtime.JSX.Element;

export { FeedbackWidget, type FeedbackWidgetProps };
