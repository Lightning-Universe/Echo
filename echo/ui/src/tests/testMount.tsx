import { mount } from "@cypress/react";
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { LightningStateContextProvider } from "hooks/useLightningState";
import { theme } from "lightning-ui/src/design-system/theme";
import { LightningState } from "types/lightning";

/**
 * Custom mount function to use in place of `cy.mount()` in component tests to render
 * identical to how components would be rendered in the real app.
 *
 * Usage:
 * ```
 * import mount from "tests/testMount";
 * ```
 */
export default function testMount(element: JSX.Element) {
  // Create a `queryClient` per test for it not to cache anything between tests
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Retries cause weird behavior in tests
        retry: false,
      },
    },
  });

  cy.fixture("lightning-state.json").then((fixture: LightningState) => {
    cy.window().then(win => {
      const subscribe = cy
        .stub()
        .as("LightningState.subscribe")
        .callsFake((callback: (newState: LightningState) => void) => {
          callback(fixture);

          return () => null;
        });

      const next = cy
        .stub()
        .as("LightningState.next")
        .callsFake((newState: LightningState) => null);

      win.LightningState = {
        subscribe,
        next,
      };
    });
  });

  return mount(
    <MuiThemeProvider
      theme={createTheme({
        ...theme,
        shape: {
          borderRadius: 8,
        },
        components: {
          ...theme.components,
          MuiLink: {
            defaultProps: { underline: "none" },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                "border": "none",
                "backgroundColor": "#E4E6EB",
                "img": {
                  color: "red",
                },
                "&.Mui-selected": {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary["10"],
                },
                "&.Mui-selected:hover": {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary["20"],
                },
                "&.MuiToggleButtonGroup-grouped:not(:last-of-type)": {
                  borderRadius: "40px 4px 4px 40px",
                  marginRight: 1,
                },
                "&.MuiToggleButtonGroup-grouped:not(:first-of-type)": {
                  borderRadius: "4px 40px 40px 4px",
                  marginLeft: 1,
                },
              },
            },
          },
          MuiToggleButtonGroup: {
            defaultProps: {},
            styleOverrides: {
              root: {
                height: "28px",
                minHeight: "100%",
              },
            },
          },
        },
      })}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <LightningStateContextProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={element} />
            </Routes>
          </BrowserRouter>
        </LightningStateContextProvider>
      </QueryClientProvider>
    </MuiThemeProvider>,
  );
}
