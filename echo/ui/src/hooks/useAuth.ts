import { useEffect } from "react";

import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

const localStorageBlockedInfo =
  "https://www.chromium.org/for-testers/bug-reporting-guidelines/uncaught-securityerror-failed-to-read-the-localstorage-property-from-window-access-is-denied-for-this-document/";
const localStorageBlockedMessage = `
  This app requires access to local storage in order to work properly. If you are using Chrome, you may need to disable the "Block third-party cookies" setting in order to use this app. For more information, see ${localStorageBlockedInfo}
  `;

const userIDKey = "echoUserID";

type LoginResponse = {
  userId: string;
};

export default function useAuth() {
  // Some security settings block access to local storage from an <iframe>
  try {
    if (typeof window.localStorage === "undefined") {
      throw new Error();
    }
  } catch (error) {
    window.alert(localStorageBlockedMessage);
  }

  const savedUserID = localStorage.getItem(userIDKey);

  const login = useQuery<LoginResponse>("login", () => echoClient.appApi.handleLoginApiLoginGet(), {
    enabled: !savedUserID,
  });

  useEffect(() => {
    if (!savedUserID && login.data?.userId) {
      localStorage.setItem(userIDKey, login.data.userId);
    }
  }, [login.data, savedUserID]);

  return { userId: savedUserID ?? login.data?.userId };
}
