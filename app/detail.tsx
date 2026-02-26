import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { theme } from "../constants/theme";
import { ProvinceData, supabase } from "../lib/supabase";

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
        .from("suratthani")
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
  const handleOpenMapApp = () => {
    if (data?.latitude && data?.longitude) {
      // สำหรับเปิด google map
      const googleMap = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
      // สำหรับเปิด apple map
      const appleMap = `https://maps.apple.com/?q=${data.latitude},${data.longitude}`;
      // ตรวจสอบการเปิดแอป google map หรือ apple map โดยยึด google map เป็นหลัก
      Linking.canOpenURL(googleMap).then((supported) => {
        if (supported) {
          Linking.openURL(googleMap);
        } else {
          Linking.openURL(appleMap);
        }
      });
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
          style={styles.errorBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: data.image_url }}
          style={styles.mainImage}
          contentFit="cover"
        />
      </View>

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

        {data.latitude && data.longitude ? (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>ตำแหน่งบนแผนที่</Text>
            <MapView
              style={{ width: "100%", height: 300 }}
              initialRegion={{
                latitude: Number(data.latitude),
                longitude: Number(data.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: Number(data.latitude),
                  longitude: Number(data.longitude),
                }}
                title={data.name}
                description={data.address}
                onPress={handleOpenMapApp}
              />
            </MapView>
          </View>
        ) : (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>ตำแหน่งบนแผนที่</Text>
            <View style={styles.noMapContainer}>
              <Text style={styles.noMapText}>ไม่มีข้อมูลพิกัด</Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {data.phone && (
            <TouchableOpacity style={styles.callButton} onPress={makePhoneCall}>
              <Text style={styles.callButtonText}>📞 โทร</Text>
            </TouchableOpacity>
          )}
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
  errorBackButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  imageContainer: {
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: theme.spacing.md,
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
  mapSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  noMapContainer: {
    height: 300,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  noMapText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },
  callButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
