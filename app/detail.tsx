import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { theme } from "../constants/theme";
import { ProvinceData, supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProvinceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (itemId: string) => {
    try {
      const { data: result, error } = await supabase
        .from("provinces")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (data?.latitude && data?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
      Linking.openURL(url);
    }
  };

  const makePhoneCall = () => {
    if (data?.phone) {
      const phoneNumber = `tel:${data.phone}`;
      Linking.openURL(phoneNumber);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>ไม่พบข้อมูล</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: data.image_url }}
        style={styles.mainImage}
        contentFit="cover"
      />

      <View style={styles.contentContainer}>
        <Text style={styles.name}>{data.name}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>หมวดหมู่:</Text>
            <Text style={styles.infoValue}>{data.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>จังหวัด:</Text>
            <Text style={styles.infoValue}>{data.province}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ที่อยู่:</Text>
            <Text style={styles.infoValue}>{data.address}</Text>
          </View>
        </View>

        {data.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>รายละเอียด</Text>
            <Text style={styles.descriptionText}>{data.description}</Text>
          </View>
        )}

        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>ตำแหน่งบนแผนที่</Text>
          <TouchableOpacity
            style={styles.mapContainer}
            onPress={openGoogleMaps}
          >
            <Image
              source={{
                uri: `https://tile.openstreetmap.org/staticmap?center=${data.latitude},${data.longitude}&zoom=15&size=${Math.floor(width - 64)}x200&markers=${data.latitude},${data.longitude}`,
              }}
              style={styles.mapImage}
              contentFit="cover"
            />
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>
                📍 กดเพื่อเปิด Google Maps
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {data.phone && (
            <TouchableOpacity style={styles.callButton} onPress={makePhoneCall}>
              <Text style={styles.callButtonText}>📞 โทร</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.mapButton} onPress={openGoogleMaps}>
            <Text style={styles.mapButtonText}>📍 เปิดใน Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  mainImage: {
    width: "100%",
    height: 300,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  descriptionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
  },
  mapSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  mapContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.white,
  },
  mapImage: {
    width: width - 64,
    height: 200,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 180, 216, 0.8)",
    padding: theme.spacing.sm,
    alignItems: "center",
  },
  mapOverlayText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  callButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  mapButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginLeft: theme.spacing.sm,
  },
  mapButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
