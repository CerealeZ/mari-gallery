import { useAuth } from "@clerk/clerk-react";
import { SWRConfig } from "swr";
import { axiosClient } from "./client";
import { toaster } from "../../components/Toaster/functions";

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();

  return (
    <SWRConfig
      value={{
        use: [
          function (useSWRNext) {
            return function FetchTokenMiddleware(key, fetcher, config) {
              const changeToken: typeof fetcher = fetcher
                ? async (...args) => {
                    const token = await getToken();
                    if (token) {
                      axiosClient.defaults.headers.common[
                        "Authorization"
                      ] = `Bearer ${token}`;
                    }
                    return fetcher(...args);
                  }
                : null;
              const swr = useSWRNext(key, changeToken, config);
              return swr;
            };
          },
        ],
        onError: () => {
          toaster.create({
            title: "Error",
            description: "Hubo un error procesando la petición",
            type: "error",
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
