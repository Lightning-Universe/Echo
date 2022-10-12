import React from "react";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import FontFaceObserver from "fontfaceobserver";
import ReactDOM from "react-dom";

import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.REACT_APP_ECHO_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

// Make sure Roboto Mono is loaded before rendering the app as it is used within a canvas element
// The rest of the fonts don't need to be loaded before the render as they will be applied
// as soon as they are available
const font = new FontFaceObserver("Roboto Mono");
font.load().then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root"),
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
