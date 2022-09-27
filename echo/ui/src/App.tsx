import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { theme } from 'lightning-ui/src/design-system/theme';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

function App() {
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
            defaultProps: { underline: 'none' },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                'border': 'none',
                'backgroundColor': '#E4E6EB',
                'img': {
                  color: 'red',
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary['10'],
                },
                '&.Mui-selected:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary['20'],
                },
                '&.MuiToggleButtonGroup-grouped:not(:last-of-type)': {
                  borderRadius: '40px 4px 4px 40px',
                  marginRight: 1,
                },
                '&.MuiToggleButtonGroup-grouped:not(:first-of-type)': {
                  borderRadius: '4px 40px 40px 4px',
                  marginLeft: 1,
                },
              },
            },
          },
          MuiToggleButtonGroup: {
            defaultProps: {},
            styleOverrides: {
              root: {
                height: '28px',
                minHeight: '100%',
              },
            },
          },
        },
      })}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter></BrowserRouter>
      </QueryClientProvider>
    </MuiThemeProvider>
  );
}

export default App;
