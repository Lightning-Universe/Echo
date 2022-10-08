import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { LightningStateContextProvider } from "hooks/useLightningState";
import { theme } from "lightning-ui/src/design-system/theme";
import Dashboard from "routes/dashboard/Dasboard";
import MobileDemo from "routes/mobile-demo/MobileDemo";

const queryClient = new QueryClient();

function App() {
  const onMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
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
              <Route path={"*"} element={onMobile ? <MobileDemo /> : <Dashboard />} />
            </Routes>
          </BrowserRouter>
        </LightningStateContextProvider>
      </QueryClientProvider>
    </MuiThemeProvider>
  );
}

export default App;
