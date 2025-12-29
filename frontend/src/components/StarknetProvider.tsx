"use client";

import React, { useEffect, useMemo } from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  NotificationToast,
  useNotifications,
} from "@/components/shared/NotificationToast";
import { setNotificationHandler } from "@/hooks/use-contract-events";
import { CONFIG } from "@/lib/config";

function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notification, showNotification, dismissNotification } =
    useNotifications();

  useEffect(() => {
    setNotificationHandler((type, title, message) => {
      showNotification({ type, title, message });
    });
  }, [showNotification]);

  return (
    <>
      {children}
      <NotificationToast
        notification={notification}
        onDismiss={dismissNotification}
      />
    </>
  );
}

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  // Suppress MetaMask errors globally - they're expected when using Starknet
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error to filter MetaMask errors
    console.error = (...args: any[]) => {
      const errorString = args.join(" ");
      if (
        errorString.includes("MetaMask") ||
        errorString.includes("Failed to connect to MetaMask") ||
        errorString.includes("nkbihfbeogaeaoehlefnkodbefgpgknn")
      ) {
        // Silently ignore MetaMask errors
        return;
      }
      originalError.apply(console, args);
    };

    // Override window.onerror to catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("MetaMask") ||
        event.message?.includes("Failed to connect to MetaMask") ||
        event.filename?.includes("nkbihfbeogaeaoehlefnkodbefgpgknn")
      ) {
        event.preventDefault();
        return true; // Prevent default error handling
      }
      return false;
    };

    window.addEventListener("error", handleError);

    // Override unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason?.toString() || "";
      if (
        reason.includes("MetaMask") ||
        reason.includes("Failed to connect to MetaMask") ||
        reason.includes("nkbihfbeogaeaoehlefnkodbefgpgknn")
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random",
  });

  const queryClient = new QueryClient();

  // Create custom RPC provider using proxy API route to avoid CORS issues
  // The proxy route (/api/rpc) forwards requests from server (no CORS)
  const provider = useMemo(() => {
    // Use proxy API route for RPC calls to avoid CORS
    const proxyUrl = "https://starknet-sepolia-rpc.publicnode.com";

    const customProvider = new RpcProvider({ nodeUrl: proxyUrl });
    // Return a function that matches the provider interface expected by StarknetConfig
    return (chain: any) => customProvider;
  }, []);

  return (
    <StarknetConfig
      chains={[sepolia, mainnet]}
      provider={provider}
      connectors={connectors}
      explorer={voyager}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    </StarknetConfig>
  );
}
