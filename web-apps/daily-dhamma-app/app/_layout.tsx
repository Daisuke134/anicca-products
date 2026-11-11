import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/providers/AppProvider";
import { RevenueCatProvider } from "@/providers/RevenueCatProvider";
import { initAnalytics, trackAppOpened } from "@/utils/analytics";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    // Mixpanel (shared spec: kpi-churn-event-spec-2026-11-11 §3.2/§3.3).
    initAnalytics().then(() => {
      void trackAppOpened();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RevenueCatProvider>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </RevenueCatProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
