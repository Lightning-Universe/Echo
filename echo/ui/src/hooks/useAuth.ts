import { useEffect } from "react";

import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

const userIDKey = "echoUserID";

type LoginResponse = {
  userId: string;
};

export default function useAuth() {
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
