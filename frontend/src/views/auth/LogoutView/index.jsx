import React, { useState } from "react";

import Get from "src/components/common/Get";
import LoginView from "src/views/auth/LoginView";

export default function LogoutView() {
  // states
  const [resource] = useState("/auth/logout/");

  // callbacks
  const remove_auth = () => {
    // clear session storage
    const session = window.sessionStorage;
    session.removeItem("user");
    session.removeItem("api_key");
    session.clear();
  };

  // you decide what to do if logged out
  const on_success = (resp) => {
    if (resp.success) {
      // clear session storage
      remove_auth();

      // go to a landing page
      return <LoginView />;
    }
  };
  const on_error = (err) => console.error(err);

  return <Get {...{ uri: resource, on_success, on_error, silent: true }} />;
}
