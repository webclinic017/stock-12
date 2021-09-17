import { ThemeProvider } from "@material-ui/core";
import React, { useState, useEffect } from "react";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useRoutes } from "react-router-dom";
import { RestfulProvider } from "restful-react";

import GlobalStyles from "src/components/common/GlobalStyles";
import GlobalContext from "src/context";
import routes from "src/routes";
import theme from "src/theme";
import LoginView from "src/views/auth/LoginView";



const globals = {
  p517: {
    api: "http://192.168.68.107:8003/api/v1",
    host: "http://192.168.68.107:8003",
  },
};

const App = () => {
  const backend = globals.p517;
  const session = window.sessionStorage;
  const [user, setUser] = useState();
  const [api_key, setApiKey] = useState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const routing = useRoutes(routes);

  // MUST: no dependency!
  // This is a special case because the change of these two key info `user` and
  // `api_key` will not be known through any mean. So reading them from session
  // storage is the only way to get an update.
  useEffect(() => {
    // MUST: read each time we mount this component!
    setUser(session.getItem("user"));
    setApiKey(session.getItem("api_key"));

    // this bool is for convenience
    setIsAuthenticated(!!user && !!api_key);
  }, [user, api_key]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <RestfulProvider
        base={backend.api}
        requestOptions={(url, method, requestBody) => ({
          headers: {
            "content-type": "application/json",
            Authorization: `ApiKey ${user}:${api_key}`,
          },
        })}
      >
        <GlobalContext.Provider value={{ ...backend }}>
          {isAuthenticated ? routing : <LoginView />}
        </GlobalContext.Provider>
      </RestfulProvider>
    </ThemeProvider>
  );
};

export default App;
