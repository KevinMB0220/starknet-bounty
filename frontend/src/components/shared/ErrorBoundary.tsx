"use client"

import React from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Ignore MetaMask connection errors - they're expected when using Starknet
    if (
      error.message?.includes("MetaMask") ||
      error.message?.includes("Failed to connect to MetaMask") ||
      error.stack?.includes("nkbihfbeogaeaoehlefnkodbefgpgknn") // MetaMask extension ID
    ) {
      console.warn("[ErrorBoundary] Ignoring MetaMask error (expected for Starknet):", error.message)
      return { hasError: false, error: null }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignore MetaMask errors
    if (
      error.message?.includes("MetaMask") ||
      error.message?.includes("Failed to connect to MetaMask") ||
      error.stack?.includes("nkbihfbeogaeaoehlefnkodbefgpgknn")
    ) {
      console.warn("[ErrorBoundary] Ignoring MetaMask error:", error.message)
      return
    }

    console.error("[ErrorBoundary] Caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-stark-dark text-white">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
              <p className="text-muted-foreground">{this.state.error.message}</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-stark-blue text-white rounded hover:bg-stark-blue/90"
              >
                Try again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

