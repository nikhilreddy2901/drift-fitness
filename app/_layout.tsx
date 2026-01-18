import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { initializeDatabase } from "@/src/db/init";
import { colors } from "@/src/constants/theme";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log("[App] Initializing database...");
        await initializeDatabase();
        setIsReady(true);
      } catch (e) {
        console.error("[App] Database initialization failed:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }

    prepare();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Database Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.blue[600]} />
        <Text style={styles.loadingText}>Initializing Drift Fitness...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.red[600],
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
