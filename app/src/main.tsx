import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router";
import ImagePreview from "./pages/ImagePreview/index.tsx";
import Start from "./pages/start/index.tsx";
import { confirmDialog } from "./components/ConfirmModal/index.tsx";
import { Toaster } from "./components/Toaster/index.tsx";
import { SWRProvider } from "./providers/swr/provider.tsx";

const system = createSystem(defaultConfig);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <SWRProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/dashboard" element={<App />} />
              <Route path="/gallery/:imageId" element={<ImagePreview />} />
            </Routes>
          </BrowserRouter>
        </SWRProvider>
        <confirmDialog.Viewport />
        <Toaster />
      </ClerkProvider>
    </ChakraProvider>
  </StrictMode>
);
